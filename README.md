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
npm run build
npm run preview
```

## Editor

The editor is Monaco with JavaScript IntelliSense. It loads the declaration file shipped by the `imagescript` npm dependency, so completions, hover docs, parameter hints and diagnostics use the library's published types.

Available globals in user code:

- `Image`, `Animation`, `AnimationEncoder`, `Frame`, `GIF`, `ImageType`, `TextLayout`
- `decode`
- `input` (`Uint8Array` containing the selected file)
- `console` (forwarded to the playground console)

Return an `Image` to preview a PNG, encoded bytes to preview/download the detected format, or another value to inspect it as text or JSON. `Ctrl` / `⌘` + `Enter` runs the code.
