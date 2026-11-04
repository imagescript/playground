const inter = await loadFont('inter');
const img = await Image.decode(input);

const width = 480;
const height = 300;
const frameCount = 36;
const focus = { x: 0.62, y: 0.42 }; // where the zoom ends up, relative to the image
const ease = (t) => t * t * (3 - 2 * t);

const caption = await Image.renderText(inter, 34, 'Ken Burns effect', {
  color: 0xffffffff, strokeWidth: 1, strokeColor: 0x00000060, variations: { weight: 700 }
});

const frames = [];
for (let i = 0; i < frameCount; i++) {
  const t = ease(i / (frameCount - 1));
  const scale = 1 - 0.35 * t; // share of the image the frame shows
  const regionWidth = Math.round(img.width * scale);
  const regionHeight = Math.round(Math.min(img.height, regionWidth * height / width));
  const x = Math.round((img.width - regionWidth) * (0.5 + (focus.x - 0.5) * t));
  const y = Math.round((img.height - regionHeight) * (0.5 + (focus.y - 0.5) * t));
  const frame = img.region(x, y, regionWidth, regionHeight).cover(width, height);

  // the caption fades in during the second half
  const alpha = Math.max(0, Math.min(1, (i / (frameCount - 1) - 0.45) / 0.35));
  if (alpha > 0) frame.composite(caption.clone().opacity(alpha), 24, height - caption.height - 20);

  frames.push(Frame.from(frame, { duration: i === frameCount - 1 ? 1500 : 70 }));
}

const animation = new Animation(frames);
return animation.encodeWebP({ quality: 75 });
