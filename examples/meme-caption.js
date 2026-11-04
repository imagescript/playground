const [inter, emoji] = await Promise.all([loadFont('inter'), loadFont('noto-color-emoji')]);
const img = await Image.decode(input);
img.resize(1000, Image.RESIZE_AUTO); // the width, keeping the aspect ratio

const top = 'When the build passes';
const bottom = 'on the first try 🎉';

const pad = Math.round(img.width * 0.04);
const size = Math.round(img.width / 13);
const caption = (text) => Image.renderText([inter, emoji], size, text.toUpperCase(), {
  color: 0xffffffff,
  strokeWidth: Math.max(3, Math.round(size / 14)),
  strokeColor: 0x000000ff,
  variations: { weight: 900, opticalSize: 32 },
  layout: new TextLayout({ maxWidth: img.width - pad * 2, horizontalAlign: 'center' })
});

const upper = await caption(top);
const lower = await caption(bottom);
img.composite(upper, Math.round((img.width - upper.width) / 2), pad);
img.composite(lower, Math.round((img.width - lower.width) / 2), img.height - lower.height - pad);

return img.encodeJPEG(90);
