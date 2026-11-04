const [inter, noto, twemoji] = await Promise.all([loadFont('inter'), loadFont('noto-color-emoji'), loadFont('twemoji')]);

const rows = [
  ['Faces', '😀 🥹 😎 🤯 🫠'],
  ['ZWJ sequences', '👩‍💻 🧑‍🚀 👨‍👩‍👧 🐻‍❄️ ❤️‍🔥'],
  ['Skin tones', '👋🏻 👋🏼 👋🏽 👋🏾 👋🏿'],
  ['Flags', '🇩🇪 🇯🇵 🇧🇷 🏳️‍🌈 🏴‍☠️'],
  ['Keycaps & symbols', '1️⃣ #️⃣ ♻️ ⚠️ ✅'],
  ['Nature & food', '🌈 🔥 🌊 🍕 🧋']
];

const size = 56;
const labelWidth = 330;
const column = 470;
const rowHeight = 92;
const canvas = new Image(labelWidth + column * 2 + 40, 130 + rows.length * rowHeight).fill(0xf7f7fbff);

const label = (text, options) => Image.renderText(inter, 26, text, { color: 0x1f2937ff, ...options });
canvas.composite(await label('Noto Color Emoji · COLRv1', { variations: { weight: 700 } }), labelWidth, 40);
canvas.composite(await label('Twemoji · COLRv0', { variations: { weight: 700 } }), labelWidth + column, 40);

for (const [i, [name, emoji]] of rows.entries()) {
  const y = 110 + i * rowHeight;
  if (i % 2 === 0) canvas.drawBox(0, y - 12, canvas.width, rowHeight, 0xebebf3ff);
  canvas.composite(await label(name, { color: 0x6b7280ff }), 40, y + 18);
  // text first, emoji font second: every character comes from the first font that has it
  canvas.composite(await Image.renderText([inter, noto], size, emoji), labelWidth, y);
  canvas.composite(await Image.renderText([inter, twemoji], size, emoji), labelWidth + column, y);
}

return canvas.encode();
