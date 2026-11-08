const img = await Image.decode(input);

const tile = 360;
const gap = 12;
const cols = 3;
img.cover(tile, tile);

// The layer we blend on top of the photo
const layer = Image.linearGradient(tile, tile, { stops: [0xff4d8dff, 0xffd166ff, 0x06d6a0ff], angle: 135 });

// (`@type {const}` keeps the names as BlendMode literals instead of strings)
const modes = /** @type {const} */ (['multiply', 'screen', 'overlay', 'soft-light', 'difference', 'color-dodge']);
const rows = Math.ceil(modes.length / cols);
const sheet = new Image(cols * tile + (cols + 1) * gap, rows * tile + (rows + 1) * gap).fill(0x111111ff);

modes.forEach((mode, i) => {
  const cell = img.clone().composite(layer, { mode });
  const x = gap + (i % cols) * (tile + gap);
  const y = gap + Math.floor(i / cols) * (tile + gap);
  sheet.composite(cell, { x, y });
});

return sheet.encodeJPEG({ quality: 90 });
