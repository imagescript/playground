const img = await Image.decode(input);

// A white outline that follows the subject's edge, then a soft dark blue shadow behind it
const sticker = img
  .outline({ width: 14, color: 0xffffffff })
  .dropShadow({ x: 4, y: 8, blur: 6, color: 0x1a1a3373 });

return sticker.encodePNG();
