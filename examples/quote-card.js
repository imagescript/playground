const [playfair, img] = await Promise.all([loadFont('playfair-display'), Image.decode(input)]);

const quote = 'The best way to predict the future is to invent it.';
const author = 'Alan Kay';
const size = 1080;
const pad = 120;

const background = img.cover(size / 4, size / 4).blur(6).cover(size, size).brightness(0.45);
const card = new Image(size, size).composite(background);

const mark = await Image.renderText('“', { font: playfair, size: 260, color: 0xfbbf24cc, variations: { weight: 900 } });
const text = await Image.renderText(quote, {
  font: playfair, size: 72,
  color: 0xffffffff,
  variations: { weight: 600 },
  layout: new TextLayout({ maxWidth: size - pad * 2, horizontalAlign: 'center' })
});
const credit = await Image.renderText(`— ${author}`, { font: playfair, size: 40, color: 0xfde68aff, features: { smcp: true } });

const blockHeight = mark.height * 0.55 + text.height + 40 + credit.height;
let y = Math.round((size - blockHeight) / 2);
card.composite(mark, { x: Math.round((size - mark.width) / 2), y: y - Math.round(mark.height * 0.25) });
y += Math.round(mark.height * 0.55);
card.composite(text, { x: Math.round((size - text.width) / 2), y });
card.composite(credit, { x: Math.round((size - credit.width) / 2), y: y + text.height + 40 });

return card.encodeJPEG({ quality: 90 });
