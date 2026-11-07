const inter = await loadFont('inter');
const width = 1200;
const canvas = new Image(width, 860).fill(0x0d0b1aff);
const bold = { variations: { weight: 850 } };
const centered = (image, y) => canvas.composite(image, Math.round((width - image.width) / 2), y);

// 1. Neon: the same text in pink, blurred at a few radii for the glow, with a pale core on top
const neonText = 'NEON NIGHTS';
const glowColor = 0xff2fb9ff;
const core = await Image.renderText(inter, 120, neonText, { color: 0xffe3f6ff, ...bold });
for (const radius of [36, 18, 6]) {
  const pad = radius * 2;
  const glow = new Image(core.width + pad * 2, core.height + pad * 2);
  glow.composite(await Image.renderText(inter, 120, neonText, { color: glowColor, ...bold }), pad, pad);
  centered(glow.blur(radius), 40 - pad);
}
centered(core, 40);

// 2. Gradient fill: keep the text's coverage (alpha), replace its color by a gradient across it
const gradientText = await Image.renderText(inter, 110, 'Gradient fill', bold);
const gradient = Colors.gradient({ 0: 0x22d3eeff, 0.5: 0xa78bfaff, 1: 0xfb923cff });
const pixels = gradientText.bitmap;
for (let y = 0; y < gradientText.height; y++) {
  for (let x = 0; x < gradientText.width; x++) {
    const [r, g, b] = Colors.toRGBA(gradient(x / (gradientText.width - 1)));
    const i = (y * gradientText.width + x) * 4;
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
  }
}
centered(gradientText, 245);

// 3. Outline only: a transparent fill with a stroke
centered(await Image.renderText(inter, 110, 'Outlined', { color: 0x00000000, strokeWidth: 3, strokeColor: 0xfacc15ff, ...bold }), 420);

// 4. 3D extrusion: the same text stacked diagonally, darkest at the back, then the face
const extrudeText = 'EXTRUDED';
const depth = 14;
const face = await Image.renderText(inter, 110, extrudeText, { color: 0xf8fafcff, ...bold });
const side = await Image.renderText(inter, 110, extrudeText, { color: 0x3b82f6ff, ...bold });
const x = Math.round((width - face.width - depth) / 2);
for (let i = depth; i > 0; i--) canvas.composite(side.clone().lightness(1 - i * 0.03), x + i, 600 + i);
canvas.composite(face, x, 600);

return canvas.encode();
