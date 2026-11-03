<script lang="ts">
    import type { PlaygroundEditor } from './lib/editor';
  import { examples } from './lib/examples';
  import { createCodeEditor } from './lib/editor';

  type LogEntry = { level: 'log' | 'info' | 'warn' | 'error'; message: string };
  type Output = {
    kind: 'image' | 'blob' | 'binary' | 'text' | 'json' | 'undefined';
    value?: string;
    url?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    byteLength?: number;
    fileExtension?: string;
    elapsedMs: number;
  };
  type WorkerMessage =
    | { type: 'ready' }
    | { type: 'log'; runId: number; level: LogEntry['level']; message: string }
    | { type: 'result'; runId: number; kind: Output['kind']; value?: string; bytes?: ArrayBuffer; blob?: Blob; mimeType?: string; width?: number; height?: number; byteLength?: number; fileExtension?: string }
    | { type: 'error'; runId: number; message: string; stack?: string };
  type ActiveRun = { id: number; startedAt: number; timeoutId: number };

  let editorHost: HTMLDivElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined;
  let editor: PlaygroundEditor | undefined;
  let code = $state(examples[0].code);
  let selectedExample = $state(examples[0].id);
  let activeExampleDescription = $state(examples[0].description);
  let inputBytes: Uint8Array | null = $state(null);
  let inputName = $state('demo-image.png');
  let inputSize = $state(0);
  let inputUrl = $state('');
  let output: Output | null = $state(null);
  let logs: LogEntry[] = $state([]);
  let running = $state(false);
  let statusMessage = $state('Ready');
  let errorMessage = $state('');
  let timeoutSeconds = $state(20);
  let copied = $state(false);
  let shared = $state(false);

  let executionWorker: Worker | null = $state(null);
  let workerReady: Promise<Worker> | null = $state(null);
  let activeRun: ActiveRun | null = $state(null);
  let nextRunId = $state(0);

  let theme = $state(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    theme = e.matches ? 'dark' : 'light';
  });

  let canRun = $derived(!running && inputBytes !== null);

  $effect.pre(() => {
    if (!editorHost || editor) return;
    async function initEditor() {
      const sharedCode = await decodeCodeFromHash();
      if (sharedCode) {
        code = sharedCode;
        activeExampleDescription = 'Custom shared code snippet';
        editor?.setValue(sharedCode);
      }
    }

    void initEditor();

    editor = createCodeEditor(editorHost, code, (value) => {
      code = value;
      if (window.location.hash.startsWith('#code=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }, () => {
      void runCode();
    });

    const handleRunShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && editorHost.contains(document.activeElement)) {
        event.preventDefault();
        event.stopPropagation();
        void runCode();
      }
    };
    window.addEventListener('keydown', handleRunShortcut, true);

    void loadDefaultImage();

    return () => {
      window.removeEventListener('keydown', handleRunShortcut, true);
      if (activeRun) window.clearTimeout(activeRun.timeoutId);
      executionWorker?.terminate();
      editor?.dispose();
      if (inputUrl) URL.revokeObjectURL(inputUrl);
      if (output?.url) URL.revokeObjectURL(output.url);
    };
  });

  async function encodeCodeToHash(source: string): Promise<string> {
    const bytes = new TextEncoder().encode(source);
    const stream = new Response(bytes).body!.pipeThrough(new CompressionStream('deflate-raw'));
    const compressedBytes = new Uint8Array(await new Response(stream).arrayBuffer());
    
    let binary = '';
    for (let i = 0; i < compressedBytes.byteLength; i++) {
      binary += String.fromCharCode(compressedBytes[i]);
    }
    const base64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `#code=${base64}`;
  }

  async function decodeCodeFromHash(): Promise<string | null> {
    const hash = window.location.hash;
    if (!hash.startsWith('#code=')) return null;
    const base64 = hash.substring(6);

    try {
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const base64Standard = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64Standard);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const stream = new Response(bytes).body!.pipeThrough(new DecompressionStream('deflate-raw'));
      const decompressedBytes = await new Response(stream).arrayBuffer();
      return new TextDecoder().decode(decompressedBytes);
    } catch {
      return null;
    }
  }

  async function shareCode(): Promise<void> {
    try {
      const currentCode = editor?.getValue() ?? code;
      const hash = await encodeCodeToHash(currentCode);
      
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
      const shareUrl = window.location.href;
      
      await navigator.clipboard.writeText(shareUrl);
      shared = true;
      window.setTimeout(() => shared = false, 1800);
    } catch {
      statusMessage = 'Could not copy link';
    }
  }

  async function loadDefaultImage(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}demo-image.png`);
      if (!response.ok) throw new Error(`Could not load sample image (${response.status})`);
      const blob = await response.blob();
      inputBytes = new Uint8Array(await blob.arrayBuffer());
      inputName = 'demo-image.png';
      inputSize = blob.size;
      setInputPreview(blob);
      statusMessage = 'Ready';
      runCode();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      statusMessage = 'Input unavailable';
    }
  }

  function setInputPreview(blob: Blob): void {
    if (inputUrl) URL.revokeObjectURL(inputUrl);
    inputUrl = URL.createObjectURL(blob);
  }

  function handleExampleSelect(event: Event): void {
    const target = event.currentTarget as HTMLSelectElement;
    loadExample(target.value);
  }

  function loadExample(id: string): void {
    const example = examples.find((item) => item.id === id);
    if (!example) return;
    selectedExample = id;
    activeExampleDescription = example.description;
    code = example.code;
    editor?.setValue(example.code);
    clearPreviousOutput();
    logs = [];
    errorMessage = '';
    statusMessage = 'Ready';
    runCode();
  }

  async function handleFileChange(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      errorMessage = 'Choose an image smaller than 40 MB.';
      target.value = '';
      return;
    }

    try {
      inputBytes = new Uint8Array(await file.arrayBuffer());
      inputName = file.name;
      inputSize = file.size;
      setInputPreview(file);
      clearPreviousOutput();
      logs = [];
      errorMessage = '';
      statusMessage = 'Ready';
      runCode();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      target.value = '';
    }
  }

  function clearPreviousOutput(): void {
    if (output?.url) URL.revokeObjectURL(output.url);
    output = null;
  }

  function disposeWorker(instance: Worker): void {
    instance.terminate();
    if (executionWorker === instance) {
      executionWorker = null;
      workerReady = null;
    }
  }

  function ensureWorker(): Promise<Worker> {
    if (executionWorker && workerReady) return workerReady;

    const instance = new Worker(new URL('./lib/playground.worker.ts', import.meta.url), { type: 'module' });
    executionWorker = instance;
    const readyPromise = new Promise<Worker>((resolve, reject) => {
      let ready = false;

      instance.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;
        if (message.type === 'ready') {
          ready = true;
          resolve(instance);
          return;
        }

        if (message.type === 'log') {
          if (activeRun?.id !== message.runId) return;
          logs = [...logs, { level: message.level, message: message.message }].slice(-250);
          return;
        }

        if (message.type === 'error') {
          if (activeRun?.id !== message.runId) return;
          window.clearTimeout(activeRun.timeoutId);
          activeRun = null;
          running = false;
          errorMessage = `${message.message}${message.stack ? `\n${message.stack}` : ''}`;
          statusMessage = 'Execution failed';
          return;
        }

        if (message.type === 'result') {
          if (activeRun?.id !== message.runId) return;
          const elapsedMs = performance.now() - activeRun.startedAt;
          window.clearTimeout(activeRun.timeoutId);
          activeRun = null;
          running = false;

          let url = '';
          if ((message.kind === 'image' || message.kind === 'binary') && message.bytes) {
            url = URL.createObjectURL(new Blob([message.bytes], { type: message.mimeType || 'application/octet-stream' }));
          } else if (message.kind === 'blob' && message.blob instanceof Blob) {
            url = URL.createObjectURL(message.blob);
          }

          output = {
            kind: message.kind,
            value: message.value,
            url: url || undefined,
            mimeType: message.mimeType,
            width: message.width,
            height: message.height,
            byteLength: message.byteLength,
            fileExtension: message.fileExtension,
            elapsedMs
          };
          statusMessage = `Completed in ${formatDuration(elapsedMs)}`;
        }
      };

      instance.onerror = (event) => {
        const error = new Error(event.message || 'The execution worker failed to load.');
        if (!ready) reject(error);
        if (activeRun) {
          window.clearTimeout(activeRun.timeoutId);
          activeRun = null;
          running = false;
          errorMessage = error.message;
          statusMessage = 'Worker error';
        }
        disposeWorker(instance);
      };
    });
    workerReady = readyPromise;

    return readyPromise;
  }

  async function runCode(): Promise<void> {
    if (!inputBytes || running) return;

    running = true;
    clearPreviousOutput();
    errorMessage = '';
    logs = [];
    statusMessage = 'Starting';
    const source = code;
    const inputCopy = inputBytes.slice();
    const runId = ++nextRunId;

    let instance: Worker;
    try {
      instance = await ensureWorker();
    } catch (error) {
      running = false;
      errorMessage = error instanceof Error ? error.message : String(error);
      statusMessage = 'Worker failed';
      if (executionWorker) disposeWorker(executionWorker);
      return;
    }

    if (!running || runId !== nextRunId) return;

    const startedAt = performance.now();
    const timeoutId = window.setTimeout(() => {
      if (activeRun?.id !== runId) return;
      activeRun = null;
      running = false;
      errorMessage = `Execution timed out after ${timeoutSeconds} seconds. The worker was terminated.`;
      statusMessage = 'Timed out';
      disposeWorker(instance);
    }, timeoutSeconds * 1000);

    activeRun = { id: runId, startedAt, timeoutId };
    statusMessage = 'Running';

    try {
      const inputBuffer = inputCopy.buffer as ArrayBuffer;
      instance.postMessage({ type: 'run', runId, code: source, input: inputBuffer }, [inputBuffer]);
    } catch (error) {
      window.clearTimeout(timeoutId);
      activeRun = null;
      running = false;
      errorMessage = error instanceof Error ? error.message : String(error);
      statusMessage = 'Execution failed';
    }
  }

  function formatDuration(ms: number): string {
    return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function downloadOutput(): void {
    if (!output?.url) return;
    const anchor = document.createElement('a');
    anchor.href = output.url;
    anchor.download = `imagescript-output.${output.fileExtension || 'bin'}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      window.setTimeout(() => copied = false, 1400);
    } catch {
      statusMessage = 'Clipboard unavailable';
    }
  }

  function resetCode(): void {
    const example = examples.find((item) => item.id === selectedExample) ?? examples[0];
    code = example.code;
    activeExampleDescription = example.description;
    editor?.setValue(example.code);
    statusMessage = 'Editor reset';

    void loadDefaultImage();
  }
</script>

<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="https://imagescript.dev/" aria-label="ImageScript home">
      <img src={`${import.meta.env.BASE_URL}brand/${theme === 'dark' ? 'wordmark-dark' : 'wordmark'}.svg`} alt="ImageScript" class="brand-logo" />
      <span class="brand-divider">/</span>
      <span class="brand-section">Playground</span>
    </a>
    <nav class="topbar-links" aria-label="Project links">
      <a href="https://imagescript.dev/" target="_blank" rel="noreferrer">Docs <span aria-hidden="true">↗</span></a>
      <a href="https://github.com/imagescript/ImageScript/blob/master/bench/README.md" target="_blank" rel="noreferrer">Benchmarks <span aria-hidden="true">↗</span></a>
      <a href="https://github.com/imagescript/ImageScript" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
    </nav>
  </header>

  <main class="main-content">
    <section class="toolbar" aria-label="Playground controls">
      <div class="toolbar-left">
        <label class="example-select-wrap">
          <span class="control-label">EXAMPLE</span>
          <select value={selectedExample} onchange={handleExampleSelect} aria-label="Choose an example">
            {#each examples as example}
              <option value={example.id}>{example.title}</option>
            {/each}
          </select>
        </label>
        <span class="toolbar-divider"></span>
        <div class="input-file-label">
          <span class="control-label">INPUT</span>
          <button class="file-button" type="button" onclick={() => fileInput?.click()} title="Choose an image">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13.5V3.8m0 0L6.6 7.2M10 3.8l3.4 3.4M4 12.8v2.3c0 .6.5 1.1 1.1 1.1h9.8c.6 0 1.1-.5 1.1-1.1v-2.3"/></svg>
            <span>{inputName}</span>
            <span class="file-size">{inputSize ? formatBytes(inputSize) : '—'}</span>
          </button>
          <input bind:this={fileInput} class="visually-hidden" type="file" accept="image/*,.jxl,.tif,.tiff,.ico,.cur,.qoi,.tga,.ppm,.pgm,.pbm,.pam,.pfm,.hdr" aria-label="Upload an image" onchange={handleFileChange} />
        </div>
      </div>
      <div class="toolbar-right">
        <!-- Share Button -->
        <button class="quiet-button" type="button" onclick={shareCode} title="Share code as URL">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.3 6.7H16c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1v-8c0-.6.4-1 1-1h2.7M10 3.3v7.4m0-7.4L7.5 5.8M10 3.3l2.5 2.5"/></svg>
          {shared ? 'Link copied!' : 'Share'}
        </button>

        <!-- Copy Button -->
        <button class="quiet-button" type="button" onclick={copyCode} title="Copy code">
          <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7.5" y="7.5" width="9" height="9" rx="1.5"/><path d="M12.5 7.5V5.7c0-.7-.5-1.2-1.2-1.2H4.7C4 4.5 3.5 5 3.5 5.7v7.8c0 .7.5 1.2 1.2 1.2h1.8"/></svg>
          {copied ? 'Copied' : 'Copy'}
        </button>

        <!-- Reset Button -->
        <button class="quiet-button" type="button" onclick={resetCode} title="Reset the selected example">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10a6.5 6.5 0 1 1 1.9 4.6L3.5 16.5m0-6.5v4h4"/></svg>
          Reset
        </button>

        <!-- Run Button mit integriertem Shortcut-Badge -->
        <button class="run-button" type="button" onclick={() => runCode()} disabled={!canRun} title="Run code (Ctrl + Enter)">
          {#if running}
            <span class="spinner"></span> Running
          {:else}
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.4 4.7c0-.6.7-1 1.2-.7l8.1 5.1a1 1 0 0 1 0 1.7l-8.1 5.1c-.5.3-1.2 0-1.2-.7V4.7Z"/></svg>
            Run
            <span class="run-shortcut"><kbd>Ctrl</kbd><kbd>↵</kbd></span>
          {/if}
        </button>
      </div>
    </section>

    <section class="workspace" aria-label="Code editor and output">
      <section class="panel editor-panel" aria-label="Code editor">
        <div class="panel-header">
          <div class="panel-heading">
            <span class="file-tab"><span class="file-dot"></span>main.js</span>
          </div>
          <span class="panel-meta">JavaScript</span>
        </div>
        <div class="example-description">
          {activeExampleDescription}
        </div>
        <div class="editor-wrap" bind:this={editorHost}></div>
        <div class="editor-footer">
          <span>JavaScript</span>
          <span>{code.split('\n').length} lines</span>
        </div>
      </section>

      <section class="panel output-panel" aria-label="Output">
        <div class="panel-header">
          <div class="panel-heading"><span class="output-title">Output</span></div>
          {#if output?.url}
            <button class="download-button" type="button" onclick={downloadOutput}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.3v8.8m0 0 3.2-3.2M10 12.1 6.8 8.9M4.2 13.7v1.5c0 .7.5 1.2 1.2 1.2h9.2c.7 0 1.2-.5 1.2-1.2v-1.5"/></svg>
              Download
            </button>
          {/if}
        </div>
        <div class="output-stage" class:has-output={!!output}>
          {#if running}
            <div class="stage-state"><span class="spinner"></span><span>Executing…</span></div>
          {:else if errorMessage}
            <div class="stage-error">
              <strong>Execution failed</strong>
              <span>{errorMessage.split('\n')[0]}</span>
            </div>
          {:else if output?.url && (output.kind === 'image' || output.mimeType?.startsWith('image/'))}
            <div class="preview-image-wrap">
              <img src={output.url} alt="ImageScript output" class="preview-image" />
            </div>
          {:else if output?.kind === 'json' || output?.kind === 'text' || output?.kind === 'undefined'}
            <div class="value-output">
              <div class="value-output-label">{output.kind === 'json' ? 'OBJECT / ARRAY' : output.kind === 'undefined' ? 'NO RETURN VALUE' : 'RETURN VALUE'}</div>
              <pre>{output.value}</pre>
            </div>
          {:else if output?.url}
            <div class="binary-output">
              <strong>Binary output</strong>
              <span>{output.mimeType || 'application/octet-stream'}</span>
              <span>{formatBytes(output.byteLength || 0)}</span>
            </div>
          {:else}
            <div class="empty-output">Run the code to inspect the result.</div>
          {/if}
        </div>
        <div class="output-meta">
          {#if output}
            <div class="meta-left">
              {#if output.width && output.height}<span>{output.width} × {output.height}</span><i></i>{/if}
              <span>{output.mimeType || output.kind}</span>
              {#if output.byteLength}<i></i><span>{formatBytes(output.byteLength)}</span>{/if}
            </div>
            <span class="meta-time">{formatDuration(output.elapsedMs)}</span>
          {:else}
            <span class="meta-placeholder">{errorMessage ? 'No output' : 'No result'}</span>
            <span class="meta-time">—</span>
          {/if}
        </div>
      </section>
    </section>

    <section class="console-panel panel" aria-label="Console">
      <div class="console-header">
        <div class="console-title-group">
          <span class="console-title">Console</span>
          {#if logs.length + (errorMessage ? 1 : 0) > 0}<span class="console-count">{logs.length + (errorMessage ? 1 : 0)}</span>{/if}
        </div>
        <div class="console-header-right">
          <span class="console-status" class:failed={!!errorMessage} class:working={running}>{statusMessage}</span>
          <button class="quiet-button clear-button" type="button" onclick={() => { logs = []; errorMessage = ''; }}>Clear</button>
        </div>
      </div>
      <div class="console-body">
        {#if logs.length === 0 && !errorMessage}
          <div class="console-empty">No console output.</div>
        {:else}
          {#each logs as entry, index}
            <div class="console-line" class:warn={entry.level === 'warn'} class:error={entry.level === 'error'}>
              <span class="console-line-index">{index + 1}</span>
              <pre>{entry.message}</pre>
            </div>
          {/each}
          {#if errorMessage}
            <div class="console-line error error-stack"><span class="console-line-index">!</span><pre>{errorMessage}</pre></div>
          {/if}
        {/if}
      </div>
    </section>
  </main>
</div>