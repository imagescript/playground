const fira = await loadFont('fira-code');

const source = `// resize every image in a folder to a thumbnail
const thumbnails = await Promise.all(files.map(async (file) => {
  const image = await Image.decode(await read(file));
  if (image.width <= 640 && image.height !== 0) return image;
  return image.cover(640, 360).sharpen({ amount: 0.4 });
}));`;

const colors = { comment: '#6a737d', keyword: '#ff7b72', string: '#a5d6ff', number: '#79c0ff', call: '#d2a8ff', operator: '#ff7b72', plain: '#e6edf3' };
const tokenizer = /(\/\/.*$)|(\b(?:const|let|await|async|return|if|new)\b)|('[^']*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*(?=\())|([=!<>]=+|=>|&&|\|\||[=+\-*/<>])/gm;
const kinds = /** @type {const} */ (['comment', 'keyword', 'string', 'number', 'call', 'operator']);
const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const lines = source.split('\n').map((line) => {
  let svg = '';
  let last = 0;
  for (const match of line.matchAll(tokenizer)) {
    if (match.index > last) svg += escapeXml(line.slice(last, match.index));
    const kind = kinds[match.slice(1).findIndex((group) => group !== undefined)];
    svg += `<tspan fill="${colors[kind]}">${escapeXml(match[0])}</tspan>`;
    last = match.index + match[0].length;
  }
  return svg + escapeXml(line.slice(last));
});

const fontSize = 22;
const lineHeight = 34;
const pad = 36;
const width = 1100;
const height = 70 + lines.length * lineHeight + pad;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" rx="14" fill="#0d1117"/>
  <circle cx="${pad}" cy="32" r="8" fill="#ff5f57"/><circle cx="${pad + 26}" cy="32" r="8" fill="#febc2e"/><circle cx="${pad + 52}" cy="32" r="8" fill="#28c840"/>
  <text x="${width / 2}" y="38" text-anchor="middle" font-family="Fira Code" font-size="15" fill="#8b949e">thumbnails.js</text>
  <text font-family="Fira Code" font-size="${fontSize}" fill="${colors.plain}" xml:space="preserve">${
    lines.map((line, i) => `<tspan x="${pad}" y="${80 + i * lineHeight}">${line}</tspan>`).join('')
  }</text>
</svg>`;
const card = await Image.renderSVG(svg, { fonts: [fira] });

// The card on a gradient backdrop, with a soft shadow under it (the margin leaves room for the shadow)
const margin = 70;
const canvas = Image.linearGradient(card.width + margin * 2, card.height + margin * 2, { stops: [0x7f5af0ff, 0x2cb1bcff], angle: 135 });
const tile = new Image(canvas.width, canvas.height).composite(card, { x: margin, y: margin });
canvas.composite(tile.dropShadow({ y: 20, blur: 24, color: 0x00000080, expand: false }));

return canvas.encodePNG();
