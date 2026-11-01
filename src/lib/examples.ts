export interface PlaygroundExample {
  id: string;
  title: string;
  description: string;
  code: string;
}
export const examples: PlaygroundExample[] = [
  {
    "id": "tilted-polaroid",
    "title": "Tilted Polaroid",
    "description": "Frames the photo like an instant print: faded film colors, white border with the classic thicker bottom edge, soft shadow, a slight rotation and a warm gradient backdrop.",
    "code": "const img = await Image.decode(input);\n\nconst photoSize = 480;\nconst border = 36;\nconst bottom = 110;\n\n// Slightly faded film look\nconst photo = img.cover(photoSize, photoSize).saturation(0.85).gamma(1.05).contrast(0.95);\n\n// The paper\nconst paper = new Image(photoSize + border * 2, photoSize + border + bottom).fill(0xfbf8f1ff);\npaper.composite(photo, border, border);\npaper.roundCorners({ radius: 6 });\n\n// Paper + shadow on a transparent tile, then rotate (tile grows to fit)\nconst pad = 100;\nconst tile = new Image(paper.width + pad * 2, paper.height + pad * 2);\nconst shadow = new Image(tile.width, tile.height);\nshadow.composite(new Image(paper.width, paper.height).fill(0x00000090), pad + 8, pad + 18);\nshadow.blur(16);\ntile.composite(shadow, 0, 0).composite(paper, pad, pad);\ntile.rotate(-7);\n\n// Warm backdrop\nconst margin = 60;\nconst backdrop = Image.gradient({ 0: 0xffd9a0ff, 1: 0xf59bb4ff });\nconst w = tile.width + margin * 2;\nconst h = tile.height + margin * 2;\nconst canvas = new Image(w, h).fill((x, y) => backdrop(Math.min(1, (x + y) / (w + h))));\ncanvas.composite(tile, margin, margin);\n\nreturn canvas.encode();"
  },
  {
    "id": "avatar-with-gradient-ring",
    "title": "Avatar with Gradient Ring",
    "description": "Crops any photo into a feathered circle and wraps it in an antialiased gradient ring, ready to use as a profile picture. Shows cover(), cropCircle(), drawCircle() with a color function and Image.gradient().",
    "code": "const img = await Image.decode(input);\n\nconst size = 512;\nconst ring = 16;\nconst total = size + ring * 2;\n\n// Fill a square and cut it into a circle with a softly feathered edge\nconst avatar = img.cover(size, size).cropCircle({ feathering: 0.02 });\n\n// Draw a gradient disc that is slightly larger than the avatar\nconst accent = Image.gradient({ 0: 0xff7a18ff, 0.5: 0xff2d75ff, 1: 0x7c3aedff });\nconst canvas = new Image(total, total);\ncanvas.drawCircle(total / 2, total / 2, total / 2, (x, y) =>\n  accent(Math.min(1, (x + y) / (2 * total)))\n);\n\n// The avatar sits on top, so only the outer ring stays visible\ncanvas.composite(avatar, ring, ring);\n\nreturn canvas.encode();"
  },
  {
    "id": "floating-card-with-soft-shadow",
    "title": "Floating Card with Soft Shadow",
    "description": "Turns an image into a rounded \"card\" that floats above a subtle gradient background. The drop shadow is built from a dark rounded rectangle that gets blurred. Great for blog covers and screenshots.",
    "code": "const img = await Image.decode(input);\n\nconst radius = 36;\nconst pad = 90;\nconst card = img.cover(640, 400).roundCorners({ radius });\n\nconst width = card.width + pad * 2;\nconst height = card.height + pad * 2;\n\n// Background: soft vertical gradient\nconst bg = Image.gradient({ 0: 0xf6f8fcff, 1: 0xd9e2f1ff });\nconst canvas = new Image(width, height).fill((x, y) => bg(Math.min(1, y / height)));\n\n// Shadow: dark rounded rect on a transparent layer, offset downwards, then blurred\nconst shadow = new Image(width, height);\nconst shape = new Image(card.width, card.height).fill(0x1b2a4acc).roundCorners({ radius });\nshadow.composite(shape, pad, pad + 26);\nshadow.blur(26);\n\ncanvas.composite(shadow, 0, 0);\ncanvas.composite(card, pad, pad);\n\nreturn canvas.encode();"
  },
  {
    "id": "game-boy-camera",
    "title": "Game Boy Camera",
    "description": "Re-creates the 1998 handheld look: 160×144 resolution, a four-shade green palette and ordered Bayer dithering, then scaled up 5× with nearest-neighbor.",
    "code": "const img = await Image.decode(input);\n\n// Native Game Boy resolution, high contrast greyscale\nimg.cover(160, 144).greyscale().contrast(1.25).gamma(1.1);\n\n// Darkest -> lightest\nconst palette = [0x0f380fff, 0x306230ff, 0x8bac0fff, 0x9bbc0fff].map((c) => Image.colorToRGBA(c));\n\n// 4x4 Bayer matrix for ordered dithering\nconst bayer = [\n  [0, 8, 2, 10],\n  [12, 4, 14, 6],\n  [3, 11, 1, 9],\n  [15, 7, 13, 5],\n];\n\nconst { width: w, height: h } = img;\nconst px = img.bitmap;\nfor (let y = 0; y < h; y++) {\n  for (let x = 0; x < w; x++) {\n    const i = (y * w + x) * 4;\n    const luma = px[i] / 255; // greyscale, so red == luma\n    const threshold = (bayer[y % 4][x % 4] + 0.5) / 16 - 0.5;\n    const idx = Math.min(3, Math.max(0, Math.round(luma * 3 + threshold)));\n    const [r, g, b] = palette[idx];\n    px[i] = r;\n    px[i + 1] = g;\n    px[i + 2] = b;\n    px[i + 3] = 255;\n  }\n}\n\nimg.scale(5, { mode: Image.RESIZE_NEAREST_NEIGHBOR });\n\nreturn img.encode();"
  },
  {
    "id": "rgb-split-glitch",
    "title": "RGB Split Glitch",
    "description": "Chromatic aberration meets glitch art: the red, green and blue channels are separated, shifted against each other and re-added, then torn horizontal slices and CRT scanlines are layered on top. The \"randomness\" is seeded, so the result is reproducible.",
    "code": "const img = await Image.decode(input);\nconst { width: w, height: h } = img;\nconst shift = Math.max(3, Math.round(w / 120));\n\n// Isolate each channel by zeroing the other two\nconst red = img.clone().green(0, true).blue(0, true);\nconst green = img.clone().red(0, true).blue(0, true);\nconst blue = img.clone().red(0, true).green(0, true);\n\n// Re-add them with offsets on a black canvas\nconst base = new Image(w, h).fill(0x000000ff);\nbase.composite(red, 0, 0, { mode: 'add' });\nbase.composite(green, shift, 0, { mode: 'add' });\nbase.composite(blue, shift * 2, 0, { mode: 'add' });\n\n// Crop away the edge where not all three channels overlap\nconst out = base.crop(shift * 2, 0, w - shift * 2, h);\n\n// Tear a few horizontal slices (deterministic pseudo random numbers)\nlet seed = 1337;\nconst rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;\nfor (let n = 0; n < 7; n++) {\n  const y = Math.floor(rand() * (out.height - 40));\n  const sliceHeight = 6 + Math.floor(rand() * 30);\n  const dx = shift + Math.floor(rand() * shift * 5);\n  const slice = out.region(0, y, out.width, sliceHeight);\n  out.composite(slice, dx, y);\n}\n\n// CRT scanlines\nfor (let y = 0; y < out.height; y += 4) {\n  out.drawBox(0, y, out.width, 1, 0x00000055);\n}\n\nreturn out.encodeJPEG({ quality: 92 });"
  },
  {
    "id": "filter-presets-contact-sheet",
    "title": "Filter Presets Contact Sheet",
    "description": "Previews six looks side by side: original, sepia, noir, faded, warm and cool. Each preset is just a short chain of color adjustments, so it doubles as a cheat sheet for the color API.",
    "code": "const img = await Image.decode(input);\n\nconst tile = 320;\nconst gap = 10;\nconst cols = 3;\nimg.cover(tile, tile);\n\nconst presets = [\n  (i) => i, // original\n  (i) => i.sepia(),\n  (i) => i.greyscale().contrast(1.35).brightness(0.95),\n  (i) => i.saturation(0.6).brightness(1.1).gamma(1.2),\n  (i) => i.red(1.15).blue(0.85).brightness(1.05),\n  (i) => i.red(0.85).blue(1.2).contrast(1.1),\n];\n\nconst rows = Math.ceil(presets.length / cols);\nconst sheet = new Image(cols * tile + (cols + 1) * gap, rows * tile + (rows + 1) * gap).fill(0x101216ff);\n\npresets.forEach((apply, n) => {\n  const cell = apply(img.clone());\n  sheet.composite(cell, gap + (n % cols) * (tile + gap), gap + Math.floor(n / cols) * (tile + gap));\n});\n\nreturn sheet.encodeJPEG({ quality: 90 });"
  },
  {
    "id": "color-palette-extractor",
    "title": "Color Palette Extractor",
    "description": "Extracts the dominant and average colors of an image, derives a harmony (two analogous colors and the complement) in HSL space, and renders the five swatches as a bar below the image.",
    "code": "const img = await Image.decode(input);\nimg.resize(960, Image.RESIZE_AUTO);\n\nconst dominant = img.dominantColor();\nconst average = img.averageColor();\n\n// Derive harmonious colors by rotating the hue (hue is 0..1)\nconst [r, g, b] = Image.colorToRGB(dominant);\nconst [h, s, l] = Image.rgbaToHSLA(r, g, b, 255);\nconst rotate = (turns) => Image.hslToColor((((h + turns) % 1) + 1) % 1, s, l);\n\nconst swatches = [dominant, average, rotate(1 / 12), rotate(-1 / 12), rotate(0.5)];\n\n// Image on top, color bar below\nconst barHeight = 140;\nconst sheet = new Image(img.width, img.height + barHeight).fill(0xffffffff);\nsheet.composite(img, 0, 0);\n\nconst swatchWidth = Math.ceil(img.width / swatches.length);\nswatches.forEach((color, i) => {\n  sheet.drawBox(i * swatchWidth, img.height, swatchWidth, barHeight, color);\n});\n\nreturn sheet.encode();"
  },
  {
    "id": "blend-mode-lab",
    "title": "Blend Mode Lab",
    "description": "A 3×2 contact sheet that applies the same color gradient to the image with six different blend modes. Reading order: multiply, screen, overlay, soft-light, difference, color-dodge.",
    "code": "const img = await Image.decode(input);\n\nconst tile = 360;\nconst gap = 12;\nconst cols = 3;\nimg.cover(tile, tile);\n\n// The layer we blend on top of the photo\nconst colors = Image.gradient({ 0: 0xff4d8dff, 0.5: 0xffd166ff, 1: 0x06d6a0ff });\nconst layer = new Image(tile, tile).fill((x, y) => colors(Math.min(1, (x + y) / (2 * tile))));\n\nconst modes = ['multiply', 'screen', 'overlay', 'soft-light', 'difference', 'color-dodge'];\nconst rows = Math.ceil(modes.length / cols);\nconst sheet = new Image(cols * tile + (cols + 1) * gap, rows * tile + (rows + 1) * gap).fill(0x111111ff);\n\nmodes.forEach((mode, i) => {\n  const cell = img.clone().composite(layer, 0, 0, { mode });\n  const x = gap + (i % cols) * (tile + gap);\n  const y = gap + Math.floor(i / cols) * (tile + gap);\n  sheet.composite(cell, x, y);\n});\n\nreturn sheet.encodeJPEG({ quality: 90 });"
  },
  {
    "id": "social-media-crop-sheet",
    "title": "Social Media Crop Sheet",
    "description": "Shows how one image looks in three common formats at once: 1:1 feed post, 4:5 portrait and 16:9 landscape. Each crop is created with cover() from a fresh clone, so you can check at a glance where the subject gets cut.",
    "code": "const img = await Image.decode(input);\n\nconst height = 400;\nconst gap = 24;\nconst formats = [\n  { w: 400, h: height }, // 1:1 feed post\n  { w: 320, h: height }, // 4:5 portrait\n  { w: 711, h: height }, // 16:9 landscape\n];\n\nconst totalWidth = formats.reduce((sum, f) => sum + f.w, gap);\nconst sheet = new Image(totalWidth + gap * formats.length, height + gap * 2).fill(0x14161cff);\n\nlet x = gap;\nfor (const f of formats) {\n  const crop = img.clone().cover(f.w, f.h).roundCorners({ radius: 16 });\n  sheet.composite(crop, x, gap);\n  x += f.w + gap;\n}\n\nreturn sheet.encodeWebP({ quality: 85 });"
  },
  {
    "id": "video-thumbnail-play-button",
    "title": "Video Thumbnail Play Button",
    "description": "Dims the image slightly and stamps a vector play button in the center. The badge is rendered from an inline SVG string with renderSVG() and sized relative to the image.",
    "code": "const img = await Image.decode(input);\n\n// Make the badge stand out\nimg.brightness(0.85);\n\nconst svg =\n  '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\">' +\n  '<defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">' +\n  '<stop offset=\"0\" stop-color=\"#ff7a18\"/><stop offset=\"1\" stop-color=\"#af002d\"/>' +\n  '</linearGradient></defs>' +\n  '<circle cx=\"60\" cy=\"60\" r=\"56\" fill=\"url(#g)\"/>' +\n  '<circle cx=\"60\" cy=\"60\" r=\"56\" fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" opacity=\"0.6\"/>' +\n  '<path d=\"M47 36 L87 60 L47 84 Z\" fill=\"#fff\"/>' +\n  '</svg>';\n\nconst badge = await Image.renderSVG(svg, {\n  size: Math.round(Math.min(img.width, img.height) * 0.22),\n  mode: Image.SVG_MODE_WIDTH,\n});\n\nimg.composite(\n  badge,\n  Math.round((img.width - badge.width) / 2),\n  Math.round((img.height - badge.height) / 2),\n  { opacity: 0.92 }\n);\n\nreturn img.encodeJPEG({ quality: 90 });"
  },
  {
    "id": "sticker-outline-generator",
    "title": "Sticker Outline Generator",
    "description": "Gives a cut-out image the classic die-cut sticker look: a thick white outline created by blurring a white silhouette and boosting its alpha, plus a soft drop shadow underneath.",
    "code": "const img = await Image.decode(input);\n\nconst outline = 14;\nconst pad = outline * 3;\nconst w = img.width + pad * 2;\nconst h = img.height + pad * 2;\n\n// 1. White silhouette of the subject (keeps the alpha channel)\nconst silhouette = img.clone().red(1, true).green(1, true).blue(1, true);\n\n// 2. Spread the silhouette by blurring it and boosting the alpha channel\nconst halo = new Image(w, h);\nhalo.composite(silhouette, pad, pad);\nhalo.blur(outline / 2);\nconst px = halo.bitmap;\nfor (let i = 3; i < px.length; i += 4) {\n  px[i] = Math.min(255, px[i] * 6);\n}\n\n// 3. Soft shadow from the same shape in dark blue\nconst shadow = halo.clone().red(0.1, true).green(0.1, true).blue(0.2, true).opacity(0.45);\nshadow.blur(6);\n\n// 4. Stack: shadow, outline, subject\nconst sticker = new Image(w, h);\nsticker.composite(shadow, 4, 8);\nsticker.composite(halo, 0, 0);\nsticker.composite(img, pad, pad);\n\nreturn sticker.encode();"
  },
  {
    "id": "duotone-gradient-map",
    "title": "Duotone Gradient Map",
    "description": "A trendy poster look: the photo is turned into greyscale, tinted with a diagonal magenta-to-yellow gradient using the \"multiply\" blend mode, and the shadows are lifted to deep indigo with \"lighten\".",
    "code": "const img = await Image.decode(input);\nconst { width: w, height: h } = img;\n\n// 1. Strip the colors and punch up the contrast\nimg.greyscale().contrast(1.15);\n\n// 2. Multiply a diagonal gradient on top: highlights take the gradient color\nconst palette = Image.gradient({ 0: 0xff2e93ff, 0.5: 0xff8a3cff, 1: 0xffe66dff });\nconst tint = new Image(w, h).fill((x, y) => palette(Math.min(1, (x + y) / (w + h))));\nimg.composite(tint, 0, 0, { mode: 'multiply' });\n\n// 3. Lighten against a solid indigo: pure blacks become indigo\nconst shadows = new Image(w, h).fill(0x1b1464ff);\nimg.composite(shadows, 0, 0, { mode: 'lighten' });\n\nreturn img.encodeJPEG({ quality: 90 });"
  },
  {
    "id": "kaleidoscope-mirror",
    "title": "Kaleidoscope Mirror",
    "description": "Takes one quarter of the image and mirrors it horizontally and vertically to build a perfectly symmetrical, kaleidoscope-style tile. Demonstrates region(), clone() and flip().",
    "code": "const img = await Image.decode(input);\n\nconst size = 800;\nconst half = size / 2;\n\n// Grab a quarter-sized region slightly off-center (region() copies, cover() resizes in place)\nimg.cover(size, size);\nconst offset = Math.round(size * 0.15);\nconst quarter = img.region(offset, offset, half, half);\n\n// Mirror it into all four quadrants\nconst out = new Image(size, size);\nout.composite(quarter, 0, 0);\nout.composite(quarter.clone().flip('horizontal'), half, 0);\nout.composite(quarter.clone().flip('vertical'), 0, half);\nout.composite(quarter.clone().flip('horizontal').flip('vertical'), half, half);\n\nreturn out.encodeJPEG({ quality: 92 });"
  },
  {
    "id": "web-thumbnail-webp",
    "title": "Web Thumbnail (WebP)",
    "description": "The everyday workhorse: crop to a 16:9 thumbnail, sharpen slightly to compensate for the downscale, and export as a small lossy WebP.",
    "code": "const img = await Image.decode(input);\n\n// cover() fills the box exactly and crops the overflow\nimg.cover(640, 360, { mode: Image.RESIZE_AREA });\n\n// Downscaling softens an image a bit, a light unsharp mask brings the detail back\nimg.sharpen({ amount: 0.6, radius: 1 });\n\nreturn img.encodeWebP({ quality: 72, effort: 4 });"
  }
];