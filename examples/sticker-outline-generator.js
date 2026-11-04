const img = await Image.decode(input);

const outline = 14;
const pad = outline * 3;
const w = img.width + pad * 2;
const h = img.height + pad * 2;

// 1. White silhouette of the subject (keeps the alpha channel)
const silhouette = img.clone().red(1, true).green(1, true).blue(1, true);

// 2. Spread the silhouette by blurring it and boosting the alpha channel
const halo = new Image(w, h);
halo.composite(silhouette, pad, pad);
halo.blur(outline / 2);
const px = halo.bitmap;
for (let i = 3; i < px.length; i += 4) {
  px[i] = Math.min(255, px[i] * 6);
}

// 3. Soft shadow from the same shape in dark blue
const shadow = halo.clone().red(0.1, true).green(0.1, true).blue(0.2, true).opacity(0.45);
shadow.blur(6);

// 4. Stack: shadow, outline, subject
const sticker = new Image(w, h);
sticker.composite(shadow, 4, 8);
sticker.composite(halo, 0, 0);
sticker.composite(img, pad, pad);

return sticker.encode();
