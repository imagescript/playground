const pixelFont = await loadFont('press-start-2p');
const img = await Image.decode(input);

const width = 256;
const height = 144;
const screen = img.cover(width, height).saturation(1.4).contrast(1.2);

// posterize: 4 levels per channel (64 colors)
const levels = 4;
const step = 255 / (levels - 1);
const pixels = screen.bitmap;
for (let i = 0; i < pixels.length; i += 4) {
  for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(pixels[i + c] / step) * step;
}

// darken the band behind the title
screen.composite(new Image(width, 46).fill(0x000000a0), 0, 22);

// hinting off: the outlines are already on the pixel grid
const text = (value, color, size = 16) => Image.renderText(pixelFont, size, value, { color, hinting: false });
const shadowed = async (value, color, y, size) => {
  const shadow = await text(value, 0x1e1b4bff, size);
  const glyphs = await text(value, color, size);
  const x = Math.round((width - glyphs.width) / 2);
  screen.composite(shadow, x + 2, y + 2).composite(glyphs, x, y);
};

await shadowed('IMAGESCRIPT', 0xfde047ff, 28, 16);
await shadowed('QUEST', 0xf472b6ff, 48, 16);
await shadowed('PRESS START', 0xffffffff, 112, 8);
await shadowed('© 2026', 0xa5b4fcff, 128, 8);

return screen.scale(5, ResizeModes.NEAREST_NEIGHBOR).encode();
