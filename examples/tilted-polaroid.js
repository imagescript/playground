const img = await Image.decode(input);
const caveat = await loadFont('caveat');
const caption = 'Summer at the lake, 2026';

const photoSize = 480;
const border = 36;
const bottom = 110;

// Slightly faded film look
const photo = img.cover(photoSize, photoSize).saturation(0.85).gamma(1.05).contrast(0.95);

// The paper
const paper = new Image(photoSize + border * 2, photoSize + border + bottom).fill(0xfbf8f1ff);
paper.composite(photo, border, border);

// A handwritten caption in the thick bottom edge, in a pen-like blue
const label = await Image.renderText(caveat, 54, caption, { color: 0x2a3a8cdd, variations: { weight: 500 } });
paper.composite(label, Math.round((paper.width - label.width) / 2), photoSize + border + Math.round((bottom - label.height) / 2));
paper.roundCorners({ radius: 6 });

// Paper + shadow on a transparent tile, then rotate (tile grows to fit)
const pad = 100;
const tile = new Image(paper.width + pad * 2, paper.height + pad * 2);
const shadow = new Image(tile.width, tile.height);
shadow.composite(new Image(paper.width, paper.height).fill(0x00000090), pad + 8, pad + 18);
shadow.blur(16);
tile.composite(shadow, 0, 0).composite(paper, pad, pad);
tile.rotate(-7);

// Warm backdrop
const margin = 60;
const backdrop = Image.gradient({ 0: 0xffd9a0ff, 1: 0xf59bb4ff });
const w = tile.width + margin * 2;
const h = tile.height + margin * 2;
const canvas = new Image(w, h).fill((x, y) => backdrop(Math.min(1, (x + y) / (w + h))));
canvas.composite(tile, margin, margin);

return canvas.encode();
