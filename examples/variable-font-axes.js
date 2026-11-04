const [flex, inter] = await Promise.all([loadFont('roboto-flex'), loadFont('inter')]);

const weights = [100, 300, 500, 700, 900, 1000];
const widths = [25, 75, 100, 151];
const cell = { width: 250, height: 96 };
const left = 150;
const top = 70;

const canvas = new Image(left + weights.length * cell.width + 30, top + widths.length * cell.height + 3 * 110 + 40).fill(0xfffdf8ff);
const label = (text, color = 0x9ca3afff) => Image.renderText(inter, 18, text, { color, variations: { weight: 600 } });
const word = (size, variations, color = 0x111827ff) => Image.renderText(flex, size, 'Flex', { color, variations });

for (const [column, weight] of weights.entries()) canvas.composite(await label(`wght ${weight}`), left + column * cell.width, 30);
for (const [row, width] of widths.entries()) {
  const y = top + row * cell.height;
  canvas.composite(await label(`wdth ${width}`), 30, y + 34);
  for (const [column, weight] of weights.entries()) {
    canvas.composite(await word(64, { weight, width }), left + column * cell.width, y);
  }
}

// One axis at a time, at the default weight and width
const rows = [
  { name: 'slant', values: [0, -5, -10], variations: (value) => ({ slant: value }) },
  { name: 'grade', values: [-200, 0, 150], variations: (value) => ({ GRAD: value }) },
  { name: 'opsz', values: [8, 36, 144], variations: (value) => ({ opticalSize: value }) }
];
let y = top + widths.length * cell.height + 30;
for (const { name, values, variations } of rows) {
  canvas.composite(await label(name, 0x6b7280ff), 30, y + 34);
  for (const [i, value] of values.entries()) {
    canvas.composite(await word(64, variations(value), 0x1d4ed8ff), left + i * 2 * cell.width, y);
    canvas.composite(await label(String(value)), left + i * 2 * cell.width + 150, y + 34);
  }
  y += 110;
}

return canvas.encode();
