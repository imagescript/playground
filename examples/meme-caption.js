const [inter, emoji] = await Promise.all([loadFont('inter'), loadFont('noto-color-emoji')]);
const img = await Image.decode(input);
img.resize({ width: 1000 }); // the width, keeping the aspect ratio

const top = 'When the build passes';
const bottom = 'on the first try 🎉';

const pad = Math.round(img.width * 0.04);
const size = Math.round(img.width / 13);
const caption = (text) => Image.renderText(text.toUpperCase(), {
  font: [inter, emoji], size,
  color: 0xffffffff,
  strokeWidth: Math.max(3, Math.round(size / 14)),
  strokeColor: 0x000000ff,
  variations: { weight: 900, opticalSize: 32 },
  layout: new TextLayout({ maxWidth: img.width - pad * 2, horizontalAlign: 'center' })
});

const upper = await caption(top);
const lower = await caption(bottom);
img.composite(upper, { x: Math.round((img.width - upper.width) / 2), y: pad });
img.composite(lower, { x: Math.round((img.width - lower.width) / 2), y: img.height - lower.height - pad });

return img.encodeJPEG({ quality: 90 });
