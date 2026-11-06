const inter = await loadFont('inter');
const photo = (await Image.decode(input)).cover(640, 640);
const map = photo.gainMap;
if (!map) throw new Error('This image has no gain map: try the Concorde sample');

// the map's value v (0-255) boosts the linear light by 2^(min + (max - min) * (v / 255)^(1 / gamma))
const boost = map.image.clone().resize(photo.width, photo.height).bitmap;
const peak = 2 ** Math.max(...map.gainMapMax);
const toLinear = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toSRGB = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

// both renditions darkened by the brightest boost, so an SDR screen can show the difference: the SDR photo gets
// dim everywhere, the HDR one only where it isn't boosted
const sdr = photo.clone();
const hdr = photo.clone();
sdr.gainMap = hdr.gainMap = null;
for (let i = 0; i < photo.bitmap.length; i += 4) {
  for (let c = 0; c < 3; c++) {
    const light = toLinear(photo.bitmap[i + c]);
    const v = boost[i + c] / 255;
    const gain = map.gainMapMin[c] + (map.gainMapMax[c] - map.gainMapMin[c]) * v ** (1 / map.gamma[c]);
    sdr.bitmap[i + c] = toSRGB(light / peak);
    hdr.bitmap[i + c] = toSRGB(Math.min(1, ((light + map.offsetSDR[c]) * 2 ** gain - map.offsetHDR[c]) / peak));
  }
}

const caption = (text) => Image.renderText(inter, 22, text, { color: 0xffffffff, strokeWidth: 3, strokeColor: 0x000000c0, variations: { weight: 700 } });
const [left, right] = await Promise.all([caption('HDR'), caption('SDR')]);

// a wipe between the two, back and forth
const frames = [];
const frameCount = 40;
for (let i = 0; i < frameCount; i++) {
  const t = 0.5 - 0.5 * Math.cos((i / frameCount) * 2 * Math.PI);
  const split = Math.round(40 + t * (photo.width - 80));
  const frame = sdr.clone().composite(hdr.region(0, 0, split, photo.height), 0, 0);
  frame.drawBox(split - 1, 0, 2, photo.height, 0xffffffff);
  frame.composite(left, 12, 12).composite(right, photo.width - right.width - 12, 12);
  frames.push(Frame.from(frame, { duration: 40 }));
}

console.log(`Highlights up to ${peak.toFixed(1)}× as bright; bottom right: the gain map (white = the most boost)`);
return await new Animation(frames).encodeWebP({quality: 80});
