const [img, city] = await Promise.all([Image.decode(input), loadSample('city-night').then((bytes) => Image.decode(bytes))]);

const width = 1000;
const height = 1000;
const portrait = img.cover(width, height).greyscale().contrast(1.6).brightness(1.1);
const overlay = city.cover(width, height).flip('horizontal').saturation(1.3);

// fade the overlay out from the center (alpha by distance)
const pixels = overlay.bitmap;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const distance = Math.hypot(x / width - 0.5, y / height - 0.45) / 0.7;
    pixels[(y * width + x) * 4 + 3] = 255 * Math.max(0, Math.min(1, 1.25 - distance));
  }
}

portrait.composite(overlay, { mode: 'screen' });
// a cool tint over the whole picture
portrait.composite(new Image(width, height).fill(0x1d4ed8ff), { mode: 'soft-light' });

return portrait.encodeJPEG({ quality: 90 });
