// (`@type {const}` keeps the ids as the literal names loadFont() takes instead of strings)
const specimens = /** @type {const} */ ([
  { id: 'inter', name: 'Inter', text: 'The quick brown fox jumps over the lazy dog 0123456789', size: 44, variations: { weight: 500 } },
  { id: 'roboto-flex', name: 'Roboto Flex', text: 'Variable in 13 axes: wide, narrow, bold, light', size: 44, variations: { weight: 650, width: 120 } },
  { id: 'playfair-display', name: 'Playfair Display', text: 'Elegant high-contrast serif — Est. 1987', size: 44, variations: {} },
  { id: 'fira-code', name: 'Fira Code', text: 'if (a !== b && c <= d) return x => x * 2;', size: 44, variations: {} },
  { id: 'caveat', name: 'Caveat', text: 'Handwritten notes, scribbled in a hurry!', size: 44, variations: {} },
  { id: 'press-start-2p', name: 'Press Start 2P', text: 'INSERT COIN TO CONTINUE', size: 24, variations: {} },
  { id: 'noto-naskh-arabic', name: 'Noto Naskh Arabic', text: 'الخط العربي جميل', size: 44, variations: {} },
  { id: 'noto-sans-devanagari', name: 'Noto Sans Devanagari', text: 'देवनागरी लिपि सुंदर है', size: 44, variations: {} },
  { id: 'noto-color-emoji', name: 'Noto Color Emoji', text: '🎨🖼️🦄🌈🚀✨🍩🐙', size: 44, variations: {} },
  { id: 'twemoji', name: 'Twemoji', text: '🎨🖼️🦄🌈🚀✨🍩🐙', size: 44, variations: {} }
]);

const inter = await loadFont('inter');
const width = 1300;
const rowHeight = 118;
const canvas = new Image(width, 40 + specimens.length * rowHeight).fill(0xfafaf9ff);

for (const [i, { id, name, text, size, variations }] of specimens.entries()) {
  const y = 20 + i * rowHeight;
  if (i) canvas.drawBox(40, y - 1, width - 80, 1, 0xe7e5e4ff);
  const title = await Image.renderText(inter, 18, `${name}  ·  loadFont('${id}')`, { color: 0x78716cff, variations: { weight: 600 } });
  canvas.composite(title, 40, y + 14);
  const sample = await Image.renderText(await loadFont(id), size, text, {
    color: 0x1c1917ff, variations, layout: new TextLayout({ maxWidth: width - 80, maxHeight: 70 })
  });
  canvas.composite(sample, 40, y + 44);
}

return canvas.encode();
