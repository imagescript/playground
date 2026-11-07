const inter = await loadFont('inter');
const img = await Image.decode(input);

const crop = 240;
const zoom = 2;
const source = img.cover(600, 600).crop(180, 110, crop, crop);

const quality = 30;
const codecs = [
  { name: 'JPEG', encode: (image) => image.encodeJPEG(quality) },
  { name: 'WebP', encode: (image) => image.encodeWebP({ quality }) },
  { name: 'AVIF', encode: (image) => image.encodeAVIF({ quality }) },
  { name: 'JPEG XL', encode: (image) => image.encodeJXL({ quality }) }
];

const tile = crop * zoom;
const gap = 16;
const labelHeight = 76;
const columns = 2;
const rows = Math.ceil(codecs.length / columns);
const sheet = new Image(columns * tile + (columns + 1) * gap, rows * (tile + labelHeight) + gap * 2).fill(0x111318ff);
const text = (value, size, color, weight = 400) =>
  Image.renderText(inter, size, value, { color, variations: { weight }, features: { tnum: true } });

for (const [i, { name, encode }] of codecs.entries()) {
  const started = performance.now();
  const bytes = await encode(source.clone());
  const milliseconds = performance.now() - started;
  const decoded = await Image.decode(bytes);
  console.log(`${name}: ${bytes.length} bytes in ${milliseconds.toFixed(1)} ms`);

  const x = gap + (i % columns) * (tile + gap);
  const y = gap + Math.floor(i / columns) * (tile + labelHeight);
  sheet.composite(decoded.scale(zoom, ResizeModes.NEAREST_NEIGHBOR), x, y);
  sheet.composite(await text(name, 26, 0xffffffff, 700), x, y + tile + 10);
  sheet.composite(await text(`${(bytes.length / 1024).toFixed(1)} KB · ${milliseconds.toFixed(0)} ms`, 20, 0x9ca3afff), x + 150, y + tile + 14);
}

return sheet.encode();
