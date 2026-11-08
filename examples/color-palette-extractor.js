const img = await Image.decode(input);
img.resize({ width: 960 });

const dominant = img.dominantColor();
const average = img.averageColor();

// Derive harmonious colors by rotating the hue (hue is 0..1)
const [r, g, b] = Colors.toRGB(dominant);
const [h, s, l] = Colors.toHSLA(Colors.fromRGBA(r, g, b, 255));
const rotate = (turns) => Colors.fromHSL((((h + turns) % 1) + 1) % 1, s, l);

const swatches = [dominant, average, rotate(1 / 12), rotate(-1 / 12), rotate(0.5)];

// Image on top, color bar below
const barHeight = 140;
const sheet = new Image(img.width, img.height + barHeight).fill(0xffffffff);
sheet.composite(img);

const swatchWidth = Math.ceil(img.width / swatches.length);
swatches.forEach((color, i) => {
  sheet.drawBox(i * swatchWidth, img.height, swatchWidth, barHeight, color);
});

return sheet.encodePNG();
