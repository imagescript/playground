import {
  Animation,
  AnimationEncoder,
  Frame,
  GIF,
  Image,
  ImageType,
  TextLayout,
  decode
} from 'imagescript';

type RunRequest = {
  type: 'run';
  runId: number;
  code: string;
  input: ArrayBuffer;
};

type ConsoleLevel = 'log' | 'info' | 'warn' | 'error';

type WorkerResponse =
  | { type: 'ready' }
  | { type: 'log'; runId: number; level: ConsoleLevel; message: string }
  | { type: 'result'; runId: number; kind: 'image' | 'blob' | 'binary' | 'text' | 'json' | 'undefined'; value?: string; bytes?: ArrayBuffer; blob?: Blob; mimeType?: string; width?: number; height?: number; byteLength?: number; fileExtension?: string }
  | { type: 'error'; runId: number; message: string; stack?: string };

const scope = self as DedicatedWorkerGlobalScope;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;
let activeRunId = 0;

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'bigint') return `${value}n`;
  if (value instanceof Error) return `${value.name}: ${value.message}`;

  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, item: unknown) => {
      if (typeof item === 'bigint') return `${item}n`;
      if (item && typeof item === 'object') {
        if (seen.has(item)) return '[Circular]';
        seen.add(item);
        if (ArrayBuffer.isView(item)) return `${item.constructor.name}(${item.byteLength} bytes)`;
      }
      return item;
    }, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function sendLog(level: ConsoleLevel, args: unknown[]): void {
  scope.postMessage({ type: 'log', runId: activeRunId, level, message: args.map(stringify).join(' ') } satisfies WorkerResponse);
}

const playgroundConsole = {
  log: (...args: unknown[]) => sendLog('log', args),
  info: (...args: unknown[]) => sendLog('info', args),
  warn: (...args: unknown[]) => sendLog('warn', args),
  error: (...args: unknown[]) => sendLog('error', args),
  debug: (...args: unknown[]) => sendLog('log', args),
  table: (value: unknown) => sendLog('log', [value]),
  dir: (value: unknown) => sendLog('log', [value]),
  group: (...args: unknown[]) => sendLog('info', args),
  groupCollapsed: (...args: unknown[]) => sendLog('info', args),
  groupEnd: () => undefined,
  time: (label = 'default') => sendLog('info', [`${label}: use performance.now() for timings`]),
  timeEnd: () => undefined,
  clear: () => sendLog('info', ['— console cleared —'])
};

function getBinaryMime(bytes: Uint8Array): { mimeType: string; extension: string } {
  // PNG
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // JPEG
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // WebP
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  // GIF
  if (
    bytes.length >= 6 &&
    /^GIF8[79]a$/.test(String.fromCharCode(...bytes.subarray(0, 6)))
  ) {
    return { mimeType: 'image/gif', extension: 'gif' };
  }

  // JPEG XL - raw codestream
  // Signature: FF 0A
  if (
    bytes.length >= 2 &&
    bytes[0] === 0xff &&
    bytes[1] === 0x0a
  ) {
    return { mimeType: 'image/jxl', extension: 'jxl' };
  }

  // JPEG XL - container
  // Signature: 00 00 00 0C 4A 58 4C 20 0D 0A 87 0A
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x00 &&
    bytes[3] === 0x0c &&
    bytes[4] === 0x4a &&
    bytes[5] === 0x58 &&
    bytes[6] === 0x4c &&
    bytes[7] === 0x20 &&
    bytes[8] === 0x0d &&
    bytes[9] === 0x0a &&
    bytes[10] === 0x87 &&
    bytes[11] === 0x0a
  ) {
    return { mimeType: 'image/jxl', extension: 'jxl' };
  }

  // AVIF
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(4, 8)) === 'ftyp'
  ) {
    const brand = String.fromCharCode(...bytes.subarray(8, 12));

    if (brand === 'avif' || brand === 'avis') {
      return { mimeType: 'image/avif', extension: 'avif' };
    }
  }

  // BMP
  // Signature: "BM"
  if (
    bytes.length >= 2 &&
    bytes[0] === 0x42 &&
    bytes[1] === 0x4d
  ) {
    return { mimeType: 'image/bmp', extension: 'bmp' };
  }

  // PNM
  // P1/P4 = PBM
  // P2/P5 = PGM
  // P3/P6 = PPM
  if (
    bytes.length >= 3 &&
    bytes[0] === 0x50 && // "P"
    bytes[1] >= 0x31 &&
    bytes[1] <= 0x36 &&
    /\s/.test(String.fromCharCode(bytes[2]))
  ) {
    switch (bytes[1]) {
      case 0x31: // P1
      case 0x34: // P4
        return { mimeType: 'image/x-portable-bitmap', extension: 'pbm' };

      case 0x32: // P2
      case 0x35: // P5
        return { mimeType: 'image/x-portable-graymap', extension: 'pgm' };

      case 0x33: // P3
      case 0x36: // P6
        return { mimeType: 'image/x-portable-pixmap', extension: 'ppm' };
    }
  }

  // QOI
  // Signature: "qoif"
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x71 &&
    bytes[1] === 0x6f &&
    bytes[2] === 0x69 &&
    bytes[3] === 0x66
  ) {
    return { mimeType: 'image/qoi', extension: 'qoi' };
  }

  // TGA
  //
  // TGA has no reliable magic number at the beginning of the file.
  // Validate the 18-byte header instead:
  //   byte 1 = color map type: 0 or 1
  //   byte 2 = image type: 1, 2, 3, 9, 10 or 11
  //   byte 16 = pixel depth: typically 8, 15, 16, 24 or 32
  if (bytes.length >= 18) {
    const colorMapType = bytes[1];
    const imageType = bytes[2];
    const pixelDepth = bytes[16];

    const validColorMapType =
      colorMapType === 0 ||
      colorMapType === 1;

    const validImageType =
      imageType === 1 ||  // color-mapped
      imageType === 2 ||  // true-color
      imageType === 3 ||  // grayscale
      imageType === 9 ||  // RLE color-mapped
      imageType === 10 || // RLE true-color
      imageType === 11;   // RLE grayscale

    const validPixelDepth =
      pixelDepth === 8 ||
      pixelDepth === 15 ||
      pixelDepth === 16 ||
      pixelDepth === 24 ||
      pixelDepth === 32;

    if (validColorMapType && validImageType && validPixelDepth) {
      return { mimeType: 'image/x-tga', extension: 'tga' };
    }
  }

  return { mimeType: 'application/octet-stream', extension: 'bin' };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function postBinary(runId: number, bytes: Uint8Array): void {
  const detected = getBinaryMime(bytes);
  const buffer = toArrayBuffer(bytes);
  scope.postMessage({
    type: 'result', runId, kind: 'binary', bytes: buffer,
    byteLength: bytes.byteLength, mimeType: detected.mimeType, fileExtension: detected.extension
  } satisfies WorkerResponse, [buffer]);
}

scope.onmessage = async (event: MessageEvent<RunRequest>) => {
  if (event.data?.type !== 'run') return;
  const { runId } = event.data;
  activeRunId = runId;

  try {
    const input = new Uint8Array(event.data.input);
    const execute = new AsyncFunction(
      'Image', 'Animation', 'AnimationEncoder', 'Frame', 'GIF', 'ImageType', 'TextLayout', 'decode', 'input', 'console',
      `${event.data.code}\n//# sourceURL=imagescript-playground-user-code.js`
    );

    const result = await execute(
      Image, Animation, AnimationEncoder, Frame, GIF, ImageType, TextLayout, decode, input, playgroundConsole
    );

    if (result instanceof Animation) {
      scope.postMessage({
        type: 'result', runId, kind: 'json',
        value: stringify({
          type: result instanceof GIF ? 'GIF' : 'Animation',
          frameCount: result.frames.length,
          duration: result.duration,
          width: result.width,
          height: result.height,
          loopCount: result.loopCount
        })
      } satisfies WorkerResponse);
      return;
    }

    if (result instanceof Image) {
      const bytes = await result.encode();
      const buffer = toArrayBuffer(bytes);
      scope.postMessage({
        type: 'result', runId, kind: 'image', bytes: buffer,
        byteLength: bytes.byteLength, mimeType: 'image/png', fileExtension: 'png',
        width: result.width, height: result.height
      } satisfies WorkerResponse, [buffer]);
      return;
    }

    if (result instanceof Blob) {
      const mimeType = result.type || 'application/octet-stream';
      const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : mimeType === 'image/avif' ? 'avif' : 'bin';
      scope.postMessage({
        type: 'result', runId, kind: 'blob', blob: result,
        byteLength: result.size, mimeType, fileExtension: extension
      } satisfies WorkerResponse);
      return;
    }

    if (result instanceof ArrayBuffer) {
      postBinary(runId, new Uint8Array(result));
      return;
    }
    if (ArrayBuffer.isView(result)) {
      postBinary(runId, new Uint8Array(result.buffer, result.byteOffset, result.byteLength));
      return;
    }
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean' || typeof result === 'bigint') {
      scope.postMessage({ type: 'result', runId, kind: 'text', value: stringify(result) } satisfies WorkerResponse);
      return;
    }
    if (typeof result === 'undefined') {
      scope.postMessage({ type: 'result', runId, kind: 'undefined', value: 'undefined' } satisfies WorkerResponse);
      return;
    }

    scope.postMessage({ type: 'result', runId, kind: 'json', value: stringify(result) } satisfies WorkerResponse);
  } catch (error) {
    const exception = error instanceof Error ? error : new Error(String(error));
    scope.postMessage({ type: 'error', runId, message: exception.toString(), stack: exception.stack } satisfies WorkerResponse);
  }
};

// This message is sent only after all static imports (including ImageScript) have
// evaluated. The UI starts its stopwatch after receiving it, not when the worker
// download/initialization begins.
scope.postMessage({ type: 'ready' } satisfies WorkerResponse);
