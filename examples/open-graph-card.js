// What a blog or docs site would generate for every page: edit this object and run it again
const post = {
  site: 'imagescript.dev',
  tag: 'Guide',
  title: 'Generating link previews without a headless browser',
  author: 'Mathis Mensing',
  date: 'Nov 21, 2026',
};

const [inter, photo] = await Promise.all([loadFont('inter'), Image.decode(input)]);
const width = 1200;
const height = 630;
const pad = 72;

// The page's colors: a diagonal gradient with a soft glow in the corner
const card = Image.linearGradient(width, height, { stops: [0x141821ff, 0x2a2350ff], angle: 135 });
// (on a canvas with room around the circle, so the blur isn't cut off at the edges)
const glow = new Image(1000, 1000).composite(new Image(520, 520).fill(0xe85d8c66).cropCircle(), { x: 240, y: 240 }).blur(90);
card.composite(glow, { x: width - 640, y: -420 });

// The cover on the right, with rounded corners and a shadow
const cover = photo.resize({ width: 420, height: 486, fit: 'cover' }).roundCorners({ radius: 28 });
const margin = 80;
const shadowed = new Image(cover.width + margin * 2, cover.height + margin * 2).composite(cover, { x: margin, y: margin })
  .dropShadow({ y: 16, blur: 36, color: 0x00000099, expand: false });
card.composite(shadowed, { x: width - pad - cover.width - margin, y: 72 - margin });

// The text: the tag as a pill, the title wrapped to the free width, then the author with an avatar
const textWidth = width - pad * 2 - cover.width - 56;
const tag = await Image.renderText(post.tag.toUpperCase(), { font: inter, size: 22, color: 0xf28db2ff, variations: { weight: 700 } });
const pill = new Image(tag.width + 40, tag.height + 18).fill(0xe85d8c33).roundCorners({ radius: 999 });
card.composite(pill, { x: pad, y: 72 });
card.composite(tag, { x: pad + 20, y: 72 + 9 });

const title = await Image.renderText(post.title, { font: inter, size: 66, color: 0xffffffff, variations: { weight: 800 }, width: textWidth });
card.composite(title, { x: pad, y: 72 + pill.height + 36 });

const avatar = photo.clone().resize({ width: 64, height: 64, fit: 'cover' }).cropCircle();
const author = await Image.renderText(post.author, { font: inter, size: 28, color: 0xffffffff, variations: { weight: 600 } });
const meta = await Image.renderText(`${post.site} · ${post.date}`, { font: inter, size: 24, color: 0x9aa1b1ff });
card.composite(avatar, { x: pad, y: height - pad - avatar.height });
card.composite(author, { x: pad + 84, y: height - pad - avatar.height + 2 });
card.composite(meta, { x: pad + 84, y: height - pad - meta.height });

// PNG at compression level 1: nearly as small for flat graphics and several times faster than the default
return card.encodePNG({ compression: 1 });
