const [inter, playfair, fira] = await Promise.all([loadFont('inter'), loadFont('playfair-display'), loadFont('fira-code')]);

const rows = [
  { font: inter, tag: 'tnum', name: 'tabular figures', text: '1,111.11\n9,999.99', value: true },
  { font: inter, tag: 'zero', name: 'slashed zero', text: '0O 2001 0x00', value: true },
  { font: inter, tag: 'frac', name: 'fractions', text: '1/2 3/4 7/16 in', value: true },
  { font: inter, tag: 'sinf', name: 'scientific inferiors', text: 'H2O + CO2', value: true },
  { font: inter, tag: 'ss01', name: 'open digits', text: '1234567890', value: true },
  { font: inter, tag: 'ss02', name: 'disambiguation set', text: 'Il1 O0 rn m', value: true },
  { font: inter, tag: 'cv11', name: 'single-storey a', text: 'banana café', value: true },
  { font: playfair, tag: 'smcp', name: 'small caps', text: 'Small Caps Matter', value: true },
  { font: playfair, tag: 'lnum', name: 'lining figures', text: 'Since 1987: 365 days', value: true },
  { font: fira, tag: 'calt', name: 'ligatures off', text: 'a => b !== c <= d', value: false }
];

const size = 40;
const columns = [60, 360, 860];
const rowHeight = 112;
const canvas = new Image(1380, 110 + rows.length * rowHeight).fill(0xffffffff);
const label = (text, color, weight = 500, fontSize = 22) => Image.renderText(text, { font: inter, size: fontSize, color, variations: { weight } });

canvas.composite(await label('FEATURE', 0x9ca3afff, 700, 18), { x: columns[0], y: 40 });
canvas.composite(await label('DEFAULT', 0x9ca3afff, 700, 18), { x: columns[1], y: 40 });
canvas.composite(await label('WITH THE FEATURE', 0x9ca3afff, 700, 18), { x: columns[2], y: 40 });

for (const [i, { font, tag, name, text, value }] of rows.entries()) {
  const features = { [tag]: value };
  const y = 90 + i * rowHeight;
  if (i % 2 === 0) canvas.drawBox(0, y - 8, canvas.width, rowHeight, 0xf5f7fbff);
  canvas.composite(await label(`${tag}`, 0x111827ff, 700, 26), { x: columns[0], y: y + 14 });
  canvas.composite(await label(name, 0x6b7280ff, 400, 18), { x: columns[0], y: y + 52 });
  // multi-line text: lines are aligned to the right, so the tabular figures line up
  const layout = new TextLayout({ horizontalAlign: 'right' });
  canvas.composite(await Image.renderText(text, { font, size, color: 0x374151ff, layout }), { x: columns[1], y: y + (text.includes('\n') ? -6 : 12) });
  canvas.composite(await Image.renderText(text, { font, size, color: 0x2563ebff, layout, features }), { x: columns[2], y: y + (text.includes('\n') ? -6 : 12) });
}

return canvas.encodePNG();
