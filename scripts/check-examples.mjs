// Type checks the examples like the playground's editor does (Monaco's JavaScript defaults in src/lib/editor.ts:
// checkJs, strict, the same ignored diagnostics, imagescript's declarations and the playground's globals), so code
// that shows errors in the editor fails here. `node scripts/check-examples.mjs [id...]`
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import ts from 'typescript';
import * as imagescript from 'imagescript';
import { playgroundGlobals } from '../src/lib/globals.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const ids = process.argv.slice(2);
const editor = readFileSync(join(root, 'src/lib/editor.ts'), 'utf8');
const ignored = JSON.parse(editor.match(/diagnosticCodesToIgnore: (\[[^\]]*\])/)[1]);

const files = readdirSync(join(root, 'examples')).filter((file) => file.endsWith('.js'))
  .filter((file) => !ids.length || ids.includes(file.slice(0, -3)))
  .map((file) => join(root, 'examples', file));
const globals = join(root, 'playground-globals.d.ts');
const missingGlobals = Object.keys(imagescript).filter((name) => !playgroundGlobals.includes(`declare const ${name}:`));
if (missingGlobals.length) throw new Error(`ImageScript exports missing playground globals: ${missingGlobals.join(', ')}`);

const options = {
  allowJs: true, checkJs: true, noEmit: true, strict: true, target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.webworker.d.ts'], types: []
};
const host = ts.createCompilerHost(options);
const readFile = host.readFile;
host.readFile = (path) => path === globals ? playgroundGlobals : readFile(path);
const fileExists = host.fileExists;
host.fileExists = (path) => path === globals || fileExists(path);
const getSourceFile = host.getSourceFile;
host.getSourceFile = (path, language, ...rest) => path === globals
  ? ts.createSourceFile(path, playgroundGlobals, language)
  : getSourceFile(path, language, ...rest);

// every example is its own program: they're separate scripts, whose top-level names would collide in one
let errors = 0;
for (const file of files) {
  const program = ts.createProgram([globals, file], options, host);
  const diagnostics = [...program.getSyntacticDiagnostics(program.getSourceFile(file)), ...program.getSemanticDiagnostics(program.getSourceFile(file))]
    .filter((diagnostic) => !ignored.includes(diagnostic.code));
  for (const diagnostic of diagnostics) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    console.log(`${file.slice(root.length)}:${line + 1}:${character + 1} TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
  }
  errors += diagnostics.length;
}
console.log(`${files.length} examples, ${errors} errors`);
process.exitCode = errors ? 1 : 0;
