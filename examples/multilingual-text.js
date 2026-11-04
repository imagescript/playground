// by priority: every character comes from the first font that has it
const fontList = await Promise.all([loadFont('inter'), loadFont('noto-naskh-arabic'), loadFont('noto-sans-devanagari'), loadFont('noto-color-emoji')]);

const lines = [
  ['English', 'Hello, world! 👋'],
  ['Arabic', 'مرحبا بالعالم! 🌍'],
  ['Mixed (bidi)', 'The word «سلام» means peace ☮️'],
  ['Hindi', 'नमस्ते दुनिया! 🙏'],
  ['Sanskrit', 'क्षत्रिय · श्री · द्विज'],
  ['Accents', 'Ça va? Größe · Ærøskøbing · Đặng'],
];

const width = 1200;
const rowHeight = 104;
const canvas = new Image(width, 90 + lines.length * rowHeight).fill(0x10172aff);
const title = await Image.renderText(fontList, 34, 'One font list, many scripts', { color: 0xf8fafcff, variations: { weight: 700 } });
canvas.composite(title, 40, 28);

for (const [i, [language, text]] of lines.entries()) {
  const y = 90 + i * rowHeight;
  canvas.drawBox(30, y, width - 60, rowHeight - 14, i % 2 ? 0x1e293bff : 0x172033ff);
  const label = await Image.renderText(fontList, 20, language.toUpperCase(), { color: 0x94a3b8ff, variations: { weight: 600 } });
  canvas.composite(label, 56, y + Math.round((rowHeight - 14 - label.height) / 2));
  const line = await Image.renderText(fontList, 46, text, { color: 0xffffffff });
  canvas.composite(line, 290, y + Math.round((rowHeight - 14 - line.height) / 2));
}

return canvas.encode();
