# ImageScript Playground

A browser playground for [ImageScript](https://github.com/imagescript/ImageScript), published at <https://try.imagescript.dev/>.

## Development

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

## Build

```sh
npm run check
npm test        # type checks the examples like the editor does, then runs each in Node with its sample image
npm run build
npm run preview
```

## Examples, samples and fonts

Each example is a file in `examples/` (the body of an async function, see the globals below), listed with its title,
description and optional sample image in `src/lib/examples.ts`, in the order the picker shows them. The sample images
(`public/samples`, credits in `CREDITS.md`) and fonts (`public/fonts`, licenses in `LICENSES.txt`) are listed in
`src/lib/assets.ts`, which the input picker, the Fonts panel, the worker and the editor's types use.

## Editor

The editor is Monaco with JavaScript IntelliSense. It loads the declaration file shipped by the `imagescript` npm dependency, so completions, hover docs, parameter hints and diagnostics use the library's published types.

Available globals in user code:

- `Image`, `Animation`, `AnimationEncoder`, `Frame`, `GainMap`, `GIF`, `ImageType`, `TextLayout`
- `Colors`, `ResizeModes`, `SVGScaleModes`, `FrameDisposalModes`, `decode`
- `input` (`Uint8Array` containing the selected file: a sample image or the uploaded one)
- `loadFont(id)` (a bundled font's file, e.g. `await loadFont('inter')`; the Fonts button lists them)
- `loadSample(id)` (a sample image's file, e.g. to combine it with the input)
- `console` (forwarded to the playground console)

Return an `Image` to preview a PNG, an `Animation` to preview a GIF, encoded bytes to preview/download the detected format, or another value to inspect it as text or JSON. `Ctrl` / `⌘` + `Enter` runs the code.
