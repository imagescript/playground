const img = await Image.decode(input);

const size = 512;
const ring = 16;
const total = size + ring * 2;

// Fill a square and cut it into a circle with a softly feathered edge
const avatar = img.cover(size, size).cropCircle({ feathering: 0.02 });

// Draw a gradient disc that is slightly larger than the avatar
const accent = Colors.gradient({ 0: 0xff7a18ff, 0.5: 0xff2d75ff, 1: 0x7c3aedff });
const canvas = new Image(total, total);
canvas.drawCircle(total / 2, total / 2, total / 2, (x, y) =>
  accent(Math.min(1, (x + y) / (2 * total)))
);

// The avatar sits on top, so only the outer ring stays visible
canvas.composite(avatar, { x: ring, y: ring });

return canvas.encodePNG();
