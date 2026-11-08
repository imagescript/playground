const img = await Image.decode(input);

const size = 512;
const ring = 16;
const total = size + ring * 2;

// Fill a square and cut it into a circle with a softly feathered edge
const avatar = img.cover(size, size).cropCircle({ feathering: 0.02 });

// A gradient disc that is slightly larger than the avatar
const canvas = Image.linearGradient(total, total, { stops: [0xff7a18ff, 0xff2d75ff, 0x7c3aedff], angle: 135 }).cropCircle();

// The avatar sits on top, so only the outer ring stays visible
canvas.composite(avatar, { x: ring, y: ring });

return canvas.encodePNG();
