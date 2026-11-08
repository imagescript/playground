// Runs the examples like the playground's worker does, with Node and the installed imagescript: every example with its
// sample (or the default one), or the given ones (`node scripts/run-examples.mjs [id...] [--sample=cat] [--out=dir]`),
// writing their results to the out directory (default: none). Fails if any of them throws or returns nothing useful
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import * as imagescript from 'imagescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const ids = args.filter((arg) => !arg.startsWith('--'));
const out = option('out');

// the catalogs are TypeScript: read their entries' fields without a TypeScript toolchain
const parse = async (path, name) => {
  const source = await readFile(join(root, path), 'utf8');
  const start = source.indexOf(`export const ${name} = [`);
  const body = source.slice(source.indexOf('[', start), source.indexOf('] as const', start) + 1);
  return Function(`return ${body}`)();
};
const fonts = await parse('src/lib/assets.ts', 'fonts');
const samples = await parse('src/lib/assets.ts', 'samples');
const examples = await parse('src/lib/examples.ts', 'exampleList');

const asset = (dir, list, kind) => async (id) => {
  const item = list.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown ${kind} "${id}"`);
  return new Uint8Array(await readFile(join(root, 'public', dir, item.file)));
};
const loadFont = asset('fonts', fonts, 'font');
const loadSample = asset('samples', samples, 'sample');

const { Image, Animation, AnimationEncoder, Frame, GIF, ImageType, TextLayout, decode, Colors, ResizeModes, SVGScaleModes, FrameDisposalModes } = imagescript;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const quiet = { log() {}, info() {}, warn: console.warn, error: console.error };

if (out) await mkdir(out, { recursive: true });
let failed = 0;
for (const example of examples.filter((entry) => !ids.length || ids.includes(entry.id))) {
  const sample = option('sample') ?? example.sample ?? samples[0].id;
  // (still image examples refuse animated GIFs, as Image.decode() does)
  if (sample.endsWith('.gif') || samples.find((entry) => entry.id === sample)?.file.endsWith('.gif')) {
    if (option('sample') && example.sample !== sample) continue;
  }
  const code = await readFile(join(root, 'examples', `${example.id}.js`), 'utf8');
  const started = performance.now();
  try {
    const run = new AsyncFunction('Image', 'Animation', 'AnimationEncoder', 'Frame', 'GIF', 'ImageType', 'TextLayout',
      'decode', 'Colors', 'ResizeModes', 'SVGScaleModes', 'FrameDisposalModes', 'input', 'console', 'loadFont', 'loadSample', code);
    let result = await run(Image, Animation, AnimationEncoder, Frame, GIF, ImageType, TextLayout, decode, Colors, ResizeModes, SVGScaleModes, FrameDisposalModes,
      await loadSample(sample), quiet, loadFont, loadSample);
    if (result instanceof Animation) result = await result.encodeGIF();
    else if (result instanceof Image) result = await result.encodePNG();
    let description;
    if (result instanceof Uint8Array) {
      const type = ImageType.getType(result);
      const image = type && await decode(result, true);
      description = `${result.length} bytes ${type ?? 'binary'}${image ? ` ${image.width}x${image.height}` : ''}`;
      if (out) await writeFile(join(out, `${example.id}.${type ?? 'bin'}`), result);
    } else if (result !== undefined) description = JSON.stringify(result).slice(0, 80);
    else throw new Error('returned nothing');
    console.log(`ok   ${example.id} (${sample}, ${Math.round(performance.now() - started)} ms): ${description}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${example.id} (${sample}): ${error?.stack ?? error}`);
  }
}
process.exitCode = failed ? 1 : 0;
