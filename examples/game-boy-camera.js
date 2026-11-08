const img = await Image.decode(input);

// Native Game Boy resolution, high contrast greyscale
img.cover(160, 144).greyscale().contrast(1.25).gamma(1.1);

// Darkest -> lightest
const palette = [0x0f380fff, 0x306230ff, 0x8bac0fff, 0x9bbc0fff].map((c) => Colors.toRGBA(c));

// 4x4 Bayer matrix for ordered dithering
const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const { width: w, height: h } = img;
const px = img.bitmap;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const luma = px[i] / 255; // greyscale, so red == luma
    const threshold = (bayer[y % 4][x % 4] + 0.5) / 16 - 0.5;
    const idx = Math.min(3, Math.max(0, Math.round(luma * 3 + threshold)));
    const [r, g, b] = palette[idx];
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  }
}

img.scale(5, { mode: ResizeModes.NEAREST_NEIGHBOR });

return img.encodePNG();
