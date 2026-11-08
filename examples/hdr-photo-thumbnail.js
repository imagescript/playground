const inter = await loadFont('inter');
const photo = await Image.decode(input);
const map = photo.gainMap;

if (map) console.log(`Gain map: ${map.width}×${map.height}, highlights up to ${(2 ** Math.max(...map.gainMapMax)).toFixed(1)}× as bright on HDR displays`);
else console.log('No gain map in this image: try the Concorde sample');

// the same thumbnail twice: the gain map follows cover(), the right copy has it removed
const tile = 560;
const gap = 24;
const hdr = photo.clone().cover(tile, tile);
const sdr = hdr.clone();
sdr.gainMap = null;

const label = (text) => Image.renderText(text, { font: inter, size: 26, color: 0xf3f4f6ff, variations: { weight: 600 } });
const sheet = new Image(tile * 2 + gap * 3, tile + gap + 70).fill(0x111827ff);
// (compositing an image with a gain map gives the sheet one: the rest of the sheet isn't boosted)
sheet.composite(hdr, { x: gap, y: gap }).composite(sdr, { x: tile + gap * 2, y: gap });
sheet.composite(await label('With gain map (HDR)'), { x: gap, y: tile + gap + 20 });
sheet.composite(await label('Gain map removed (SDR)'), { x: tile + gap * 2, y: tile + gap + 20 });

// on an HDR display (Chrome, Edge, Safari) the left sky glows; on others both look the same
return sheet.encodeJPEG({ quality: 90 });
