const img = await Image.decode(input);
const { width: w, height: h } = img;
const shift = Math.max(3, Math.round(w / 120));

// Isolate each channel by zeroing the other two
const red = img.clone().green(0).blue(0);
const green = img.clone().red(0).blue(0);
const blue = img.clone().red(0).green(0);

// Re-add them with offsets on a black canvas
const base = new Image(w, h).fill(0x000000ff);
base.composite(red, { mode: 'add' });
base.composite(green, { x: shift, y: 0, mode: 'add' });
base.composite(blue, { x: shift * 2, y: 0, mode: 'add' });

// Crop away the edge where not all three channels overlap
const out = base.crop(shift * 2, 0, w - shift * 2, h);

// Tear a few horizontal slices (deterministic pseudo random numbers)
let seed = 1337;
const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
for (let n = 0; n < 7; n++) {
  const y = Math.floor(rand() * (out.height - 40));
  const sliceHeight = 6 + Math.floor(rand() * 30);
  const dx = shift + Math.floor(rand() * shift * 5);
  const slice = out.region(0, y, out.width, sliceHeight);
  out.composite(slice, { x: dx, y });
}

// CRT scanlines
for (let y = 0; y < out.height; y += 4) {
  out.drawBox(0, y, out.width, 1, 0x00000055);
}

return out.encodeJPEG({ quality: 92 });
