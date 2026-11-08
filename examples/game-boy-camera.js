const img = await Image.decode(input);

// Native Game Boy resolution, high contrast greyscale
img.cover(160, 144).greyscale().contrast(1.25).gamma(1.1);

// The four greens, ordered (Bayer) dithering picks between the nearest two
img.quantize({
  palette: [0x0f380fff, 0x306230ff, 0x8bac0fff, 0x9bbc0fff],
  dither: 'ordered',
});

img.scale(5, { mode: ResizeModes.NEAREST_NEIGHBOR });

return img.encodePNG();
