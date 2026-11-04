const animation = await Animation.decode(input);

// the photo inside the GIF's frame (Muybridge's sample has a black border and a ruler at the top); for other GIFs the
// whole frame
const isHorse = animation.width === 480 && animation.height === 334;
const crop = isHorse ? { x: 32, y: 54, width: 412, height: 246 } : { x: 0, y: 0, width: animation.width, height: animation.height };
const panel = { width: 360, height: Math.round(360 * crop.height / crop.width) };
const gap = 12;
const width = panel.width * 2 + gap * 3;
const height = panel.height * 2 + gap * 3;

// two runs through the frames, so the colors cycle once around the hue wheel and the loop is seamless
const frames = animation.frames;
const steps = frames.length * 2;
const encoder = Animation.webpEncoder(width, height, { quality: 80 });

for (let step = 0; step < steps; step++) {
  const frame = frames[step % frames.length];
  const photo = frame.clone().crop(crop.x, crop.y, crop.width, crop.height).resize(panel.width, panel.height).greyscale().contrast(1.4);
  const canvas = new Image(width, height).fill(0x111111ff);

  for (let p = 0; p < 4; p++) {
    // map the grey levels onto a two-color gradient whose hues turn a bit every frame
    const hue = (p / 4 + step / steps) % 1;
    const duotone = Image.gradient({ 0: Image.hslToColor(hue, 0.85, 0.22), 1: Image.hslToColor((hue + 0.45) % 1, 0.95, 0.72) });
    const lut = Array.from({ length: 256 }, (_, v) => Image.colorToRGBA(duotone(v / 255)));
    const tinted = photo.clone();
    const pixels = tinted.bitmap;
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = lut[pixels[i]];
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
    }
    canvas.composite(tinted, gap + (p % 2) * (panel.width + gap), gap + Math.floor(p / 2) * (panel.height + gap));
  }

  // each frame is compressed as it's added: only the encoded frames stay in memory
  await encoder.add(canvas, { duration: frame.duration });
}

return encoder.finish();
