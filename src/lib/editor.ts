import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TypeScriptWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';

const globals = `
declare const Image: typeof import('imagescript').Image;
declare const Animation: typeof import('imagescript').Animation;
declare const AnimationEncoder: typeof import('imagescript').AnimationEncoder;
declare const Frame: typeof import('imagescript').Frame;
declare const GIF: typeof import('imagescript').GIF;
declare const ImageType: typeof import('imagescript').ImageType;
declare const TextLayout: typeof import('imagescript').TextLayout;
declare const decode: typeof import('imagescript').decode;
declare const input: Uint8Array;
`;

let configured = false;

function configureMonaco(): void {
  if (configured) return;
  configured = true;

  (globalThis as typeof globalThis & {
    MonacoEnvironment: { getWorker: (_moduleId: string, label: string) => Worker }
  }).MonacoEnvironment = {
    getWorker: (_moduleId, label) => {
      if (label === 'typescript' || label === 'javascript') return new TypeScriptWorker();
      return new EditorWorker();
    }
  };

  monaco.typescript.javascriptDefaults.setEagerModelSync(true);
  monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    onlyVisible: false,
    diagnosticCodesToIgnore: [1375, 1108, 7006]
  });
  monaco.typescript.javascriptDefaults.setCompilerOptions({
    allowJs: true,
    allowNonTsExtensions: true,
    checkJs: true,
    noEmit: true,
    strict: true,
    target: monaco.typescript.ScriptTarget.ESNext,
    module: monaco.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
    baseUrl: 'file:///',
    paths: { imagescript: ['node_modules/imagescript/dist/index.d.ts'] },
    // The edited code executes in a Web Worker, not in the window. This also
    // avoids colliding with the DOM's global `Image` constructor: here `Image`
    // is intentionally the ImageScript class.
    lib: ['es2022', 'webworker'],
    types: []
  });

  // Install ImageScript's actual published declaration file into Monaco's virtual
  // node_modules tree. Completion/signature help then comes from the library's
  // own types rather than a hand-maintained list of guessed API members.
  // ImageScript's build emits a small declaration graph, not one standalone
  // index.d.ts. Load every published declaration so relative imports resolve
  // and Monaco can offer the complete public API (including parameter types).
  const declarationFiles = import.meta.glob('../../node_modules/imagescript/dist/**/*.d.ts', {
    eager: true,
    query: '?raw',
    import: 'default'
  }) as Record<string, string>;

  for (const [filePath, declaration] of Object.entries(declarationFiles)) {
    const virtualPath = filePath.replace(/^.*node_modules\/imagescript\//, 'file:///node_modules/imagescript/');
    monaco.typescript.javascriptDefaults.addExtraLib(declaration, virtualPath);
  }
  monaco.typescript.javascriptDefaults.addExtraLib(
    JSON.stringify({ name: 'imagescript', types: './dist/index.d.ts' }),
    'file:///node_modules/imagescript/package.json'
  );
  monaco.typescript.javascriptDefaults.addExtraLib(
    globals,
    'file:///playground-globals.d.ts'
  );

  monaco.editor.defineTheme('imagescript-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '788493', fontStyle: 'italic' },
      { token: 'string', foreground: 'B4C99C' },
      { token: 'keyword', foreground: 'C792EA' },
      { token: 'number', foreground: 'D9A66C' }
    ],
    colors: {
      'editor.background': '#111418',
      'editor.foreground': '#DCE2E9',
      'editorLineNumber.foreground': '#56616D',
      'editorLineNumber.activeForeground': '#AAB5C1',
      'editorCursor.foreground': '#8DB9F4',
      'editor.selectionBackground': '#314253',
      'editor.inactiveSelectionBackground': '#263440',
      'editor.lineHighlightBackground': '#171C22',
      'editorIndentGuide.background1': '#252C34',
      'editorIndentGuide.activeBackground1': '#465260',
      'editorWidget.background': '#171C22',
      'editorWidget.border': '#303A45',
      'editorSuggestWidget.background': '#171C22',
      'editorSuggestWidget.border': '#303A45',
      'editorSuggestWidget.selectedBackground': '#263440',
      'editorHoverWidget.background': '#171C22',
      'editorHoverWidget.border': '#303A45'
    }
  });
}

export type PlaygroundEditor = monaco.editor.IStandaloneCodeEditor;

export function createCodeEditor(
  parent: HTMLElement,
  initialCode: string,
  onChange: (value: string) => void,
  onRun: () => void
): PlaygroundEditor {
  configureMonaco();

  const model = monaco.editor.createModel(
    initialCode,
    'javascript',
    monaco.Uri.parse('file:///playground/main.js')
  );
  const editor = monaco.editor.create(parent, {
    model,
    theme: 'imagescript-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    fontSize: 13,
    lineHeight: 22,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    wordWrap: 'on',
    tabSize: 2,
    insertSpaces: true,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    suggest: {
      showWords: false,
      preview: true,
      snippetsPreventQuickSuggestions: false,
      localityBonus: true
    },
    quickSuggestions: { other: true, comments: false, strings: true },
    parameterHints: { enabled: true, cycle: true },
    hover: { enabled: 'on', delay: 350 },
    stickyScroll: { enabled: false },
    padding: { top: 14, bottom: 14 },
    scrollbar: {
      verticalScrollbarSize: 9,
      horizontalScrollbarSize: 9,
      alwaysConsumeMouseWheel: false
    }
  });

  editor.onDidChangeModelContent(() => onChange(editor.getValue()));
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun, 'editorTextFocus');

  return editor;
}

export { monaco };
