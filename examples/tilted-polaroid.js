const img = await Image.decode(input);

// A rotation by degrees (clockwise is positive) as the matrix transform() takes
const rotation = (degrees) => {
  const a = (degrees * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
};
const caveat = await loadFont('caveat');
const caption = 'Summer at the lake, 2026';

const photoSize = 480;
const border = 36;
const bottom = 110;

// Slightly faded film look
const photo = img.cover(photoSize, photoSize).saturation(0.85).gamma(1.05).contrast(0.95);

// The paper
const paper = new Image(photoSize + border * 2, photoSize + border + bottom).fill(0xfbf8f1ff);
paper.composite(photo, { x: border, y: border });

// A handwritten caption in the thick bottom edge, in a pen-like blue
const label = await Image.renderText(caption, { font: caveat, size: 54, color: 0x2a3a8cdd, variations: { weight: 500 } });
paper.composite(label, { x: Math.round((paper.width - label.width) / 2), y: photoSize + border + Math.round((bottom - label.height) / 2) });
paper.roundCorners({ radius: 6 });

// Paper with its shadow, then rotate (the image grows to fit)
const tile = paper.dropShadow({ x: 8, y: 18, blur: 16, color: 0x00000090 }).transform(rotation(7));

// Warm backdrop
const margin = 60;
const canvas = Image.linearGradient(tile.width + margin * 2, tile.height + margin * 2, { stops: [0xffd9a0ff, 0xf59bb4ff], angle: 135 });
canvas.composite(tile, { x: margin, y: margin });

return canvas.encodePNG();
