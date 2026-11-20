import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TypeScriptWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';
import { playgroundGlobals as globals } from './globals.ts';

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
    lib: ['es2022', 'webworker'],
    types: []
  });

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

  // present 0xRRGGBBAA as color in the color picker
  monaco.languages.registerColorProvider('javascript', {
    provideDocumentColors(model) {
      const text = model.getValue();
      const regex = /0x([0-9a-fA-F]{6,8})/g;
      const colors: monaco.languages.IColorInformation[] = [];
      let match;

      while ((match = regex.exec(text)) !== null) {
        const hex = match[1];
        let r = 0, g = 0, b = 0, a = 1;
        if (hex.length === 8) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
          a = parseInt(hex.substring(6, 8), 16) / 255;
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
        }

        const startPos = model.getPositionAt(match.index);
        const endPos = model.getPositionAt(match.index + match[0].length);

        colors.push({
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column
          },
          color: { red: r, green: g, blue: b, alpha: a }
        });
      }
      return colors;
    },

    provideColorPresentations(_, colorInfo) {
      const { red, green, blue, alpha } = colorInfo.color;
      const r = Math.round(red * 255).toString(16).padStart(2, '0');
      const g = Math.round(green * 255).toString(16).padStart(2, '0');
      const b = Math.round(blue * 255).toString(16).padStart(2, '0');
      const a = Math.round(alpha * 255).toString(16).padStart(2, '0');

      const hexVal = `0x${`${r}${g}${b}${a}`.toUpperCase()}`;

      return [{
        label: hexVal,
        textEdit: {
          range: colorInfo.range,
          text: hexVal
        }
      }];
    }
  });

  // The colours of the docs (imagescript.dev): the page colours of src/app.css, and the code colours of GitHub's themes
  // that the docs' code blocks use (github-dark-default and github-light-default)

  // Dark Theme
  monaco.editor.defineTheme('imagescript-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'keyword', foreground: 'FF7B72' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'type.identifier', foreground: 'FFA657' }
    ],
    colors: {
      'editor.background': '#12151C',
      'editor.foreground': '#E7E9EF',
      'editorLineNumber.foreground': '#5D6474',
      'editorLineNumber.activeForeground': '#9AA1B1',
      'editorCursor.foreground': '#F28DB2',
      'editor.selectionBackground': '#3A2B3A',
      'editor.inactiveSelectionBackground': '#2C1D27',
      'editor.lineHighlightBackground': '#1A1E28',
      'editorIndentGuide.background1': '#232834',
      'editorIndentGuide.activeBackground1': '#3A4152',
      'editorWidget.background': '#1A1E28',
      'editorWidget.border': '#2A2F3C',
      'editorSuggestWidget.background': '#1A1E28',
      'editorSuggestWidget.border': '#2A2F3C',
      'editorSuggestWidget.selectedBackground': '#2C1D27',
      'editorHoverWidget.background': '#1A1E28',
      'editorHoverWidget.border': '#2A2F3C'
    }
  });

  // Light Theme
  monaco.editor.defineTheme('imagescript-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6E7781', fontStyle: 'italic' },
      { token: 'string', foreground: '0A3069' },
      { token: 'keyword', foreground: 'CF222E' },
      { token: 'number', foreground: '0550AE' },
      { token: 'type.identifier', foreground: '953800' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#1B1F29',
      'editorLineNumber.foreground': '#8A91A0',
      'editorLineNumber.activeForeground': '#1B1F29',
      'editorCursor.foreground': '#B62E5F',
      'editor.selectionBackground': '#F6CBDA',
      'editor.inactiveSelectionBackground': '#FBE9F0',
      'editor.lineHighlightBackground': '#F4F5F8',
      'editorIndentGuide.background1': '#E3E5EB',
      'editorIndentGuide.activeBackground1': '#8A91A0',
      'editorWidget.background': '#FFFFFF',
      'editorWidget.border': '#E3E5EB',
      'editorSuggestWidget.background': '#FFFFFF',
      'editorSuggestWidget.border': '#E3E5EB',
      'editorSuggestWidget.selectedBackground': '#FBE9F0',
      'editorHoverWidget.background': '#FFFFFF',
      'editorHoverWidget.border': '#E3E5EB'
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

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = prefersDark ? 'imagescript-dark' : 'imagescript-light';

  const model = monaco.editor.createModel(
    initialCode,
    'javascript',
    monaco.Uri.parse('file:///playground/main.js')
  );
  
  const editor = monaco.editor.create(parent, {
    model,
    theme: initialTheme,
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

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newTheme = e.matches ? 'imagescript-dark' : 'imagescript-light';
    monaco.editor.setTheme(newTheme);
  });

  editor.onDidChangeModelContent(() => onChange(editor.getValue()));
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun, 'editorTextFocus');

  return editor;
}

export { monaco };