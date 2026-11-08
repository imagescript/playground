const inter = await loadFont('inter');
const width = 1200;
const canvas = new Image(width, 860).fill(0x0d0b1aff);
const bold = { variations: { weight: 850 } };
const centered = (image, y) => canvas.composite(image, { x: Math.round((width - image.width) / 2), y });

// 1. Neon: pale text with a pink glow around it (a shadow without an offset)
const core = await Image.renderText('NEON NIGHTS', { font: inter, size: 120, color: 0xffe3f6ff, ...bold });
const glowing = core.clone().dropShadow({ blur: 36, spread: 8, color: 0xff2fb9aa }).dropShadow({ blur: 12, spread: 2, color: 0xff2fb9ff });
centered(glowing, 40 - Math.round((glowing.height - core.height) / 2));

// 2. Gradient fill: take the text's colors from a gradient image, its shape (alpha) stays
const gradientText = await Image.renderText('Gradient fill', { font: inter, size: 110, ...bold });
gradientText.recolor(Image.linearGradient(gradientText.width, gradientText.height, { stops: [0x22d3eeff, 0xa78bfaff, 0xfb923cff], angle: 90 }));
centered(gradientText, 245);

// 3. Outline only: a transparent fill with a stroke
centered(await Image.renderText('Outlined', { font: inter, size: 110, color: 0x00000000, strokeWidth: 3, strokeColor: 0xfacc15ff, ...bold }), 420);

// 4. 3D extrusion: the same text stacked diagonally, darkest at the back, then the face
const extrudeText = 'EXTRUDED';
const depth = 14;
const face = await Image.renderText(extrudeText, { font: inter, size: 110, color: 0xf8fafcff, ...bold });
const side = await Image.renderText(extrudeText, { font: inter, size: 110, color: 0x3b82f6ff, ...bold });
const x = Math.round((width - face.width - depth) / 2);
for (let i = depth; i > 0; i--) canvas.composite(side.clone().lightness(1 - i * 0.03), { x: x + i, y: 600 + i });
canvas.composite(face, { x, y: 600 });

return canvas.encodePNG();
