const img = await Image.decode(input);

// Native Game Boy resolution, high contrast greyscale
img.resize({ width: 160, height: 144, fit: 'cover' }).grayscale().contrast(1.25).gamma(1.1);

// The four greens, ordered (Bayer) dithering picks between the nearest two
img.quantize({
  palette: [0x0f380fff, 0x306230ff, 0x8bac0fff, 0x9bbc0fff],
  dither: 'ordered',
});

img.scale(5, { mode: 'nearest-neighbor' });

return img.encodePNG();
