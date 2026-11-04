import type { SampleId } from './assets';

export interface PlaygroundExample {
  id: string;
  title: string;
  /** Shown above the editor (so the code doesn't repeat it in a comment) */
  description: string;
  /** The sample image the example is made for: selected with it, unless the input is an uploaded image */
  sample?: SampleId;
  /** The code, from examples/<id>.js */
  code: string;
}

// In the order the picker lists them: first one of each kind (text, effects, animation, fonts, codecs, SVG,
// compositing, color analysis, pixel manipulation), so the first few show what ImageScript can do; then the most
// interesting ones. Plain object literals (no TypeScript syntax): scripts/run-examples.mjs reads them too
export const exampleList = [
  {
    id: 'text-effects',
    title: 'Text Effects: Neon, Gradient, Outline, 3D',
    description: 'Rendered text is just another image: blurred copies make a neon glow, a gradient replaces the color but keeps the glyphs\' coverage, a stroke without fill makes an outline, and stacked darker copies an extrusion. Uses the bundled Inter variable font at a heavy weight.'
  },
  {
    id: 'rgb-split-glitch',
    title: 'RGB Split Glitch',
    sample: 'city-night',
    description: 'Chromatic aberration meets glitch art: the red, green and blue channels are separated, shifted against each other and re-added, then torn horizontal slices and CRT scanlines are layered on top. The "randomness" is seeded, so the result is reproducible.'
  },
  {
    id: 'animated-ken-burns',
    title: 'Animated WebP: Ken Burns Zoom',
    sample: 'landscape',
    description: 'A slow zoom and pan across the photo with a caption fading in, as a looping animated WebP: each frame is a cover() of a region shrinking towards a focus point. encodeGIF() and encodeAPNG() take the same frames; for photos the GIF is about four times larger.'
  },
  {
    id: 'animated-pop-art',
    title: 'Animated GIF In: Pop Art, Frame by Frame',
    sample: 'horse',
    description: 'Decodes an animated GIF (Muybridge\'s galloping horse, or your own) with Animation.decode() and turns every frame into a four-panel duotone in the style of Warhol, with hues that cycle around the color wheel. The frames are streamed into Animation.webpEncoder(), which compresses each one as it\'s added instead of keeping them all.'
  },
  {
    id: 'color-emoji',
    title: 'Color Emoji: COLRv1 vs. COLRv0',
    description: 'The same emoji in Noto Color Emoji (COLRv1: gradients, transforms and layered paints) and Twemoji (COLRv0: flat colored layers). ZWJ sequences, skin tones, flags and keycaps become single glyphs. Text and emoji fonts are combined by passing an array of fonts: every character comes from the first one that has it.'
  },
  {
    id: 'codec-comparison',
    title: 'Codec Comparison: JPEG vs. WebP vs. AVIF vs. JPEG XL',
    sample: 'cat',
    description: 'Encodes the same crop with all four lossy encoders at a low quality, decodes the results and shows them enlarged, labeled with file size and encoding time: JPEG\'s blocks and ringing, WebP\'s smearing, AVIF\'s and JPEG XL\'s smoother loss of detail.'
  },
  {
    id: 'code-screenshot',
    title: 'Code Screenshot (SVG Text, Ligatures)',
    description: 'A syntax-highlighted code card like carbon.sh: the snippet is tokenized into colored SVG <tspan>s and rendered with renderSVG() in Fira Code. Ligatures (=>, !==, <=) are shaped across the spans, so they form even where the colors change.'
  },
  {
    id: 'svg-poster',
    title: 'SVG Poster: Gradients, Filters, Clip Paths',
    sample: 'cat',
    description: 'A poster drawn as one SVG and rendered with renderSVG(): radial and linear gradients, a dot pattern, a blob wobbled by feTurbulence and feDisplacementMap, the input photo embedded as a data: URI, clipped to a circle with a drop shadow, CSS classes, text on a circular path and film grain from fractal noise.'
  },
  {
    id: 'double-exposure',
    title: 'Double Exposure',
    sample: 'dog',
    description: 'Two photos in one: the input as a bright, high-contrast greyscale silhouette, with a second sample (the city at night, loaded with loadSample()) blended in with the screen blend mode and faded out towards the edges.'
  },
  {
    id: 'color-palette-extractor',
    title: 'Color Palette Extractor',
    sample: 'landscape',
    description: 'Extracts the dominant and average colors of an image, derives a harmony (two analogous colors and the complement) in HSL space, and renders the five swatches as a bar below the image.'
  },
  {
    id: 'game-boy-camera',
    title: 'Game Boy Camera',
    sample: 'cat',
    description: 'Re-creates the 1998 handheld look by working on the pixels directly: 160×144 resolution, a four-shade green palette and ordered Bayer dithering, then scaled up 5× with nearest-neighbor.'
  },
  {
    id: 'tilted-polaroid',
    title: 'Tilted Polaroid with Handwritten Caption',
    sample: 'landscape',
    description: 'Frames the photo like an instant print: faded film colors, white border with the classic thicker bottom edge and a caption in the Caveat handwriting font, soft shadow, a slight rotation and a warm gradient backdrop.'
  },
  {
    id: 'meme-caption',
    title: 'Meme Caption with Emoji',
    sample: 'dog',
    description: 'The classic meme layout: heavy white capitals with a black outline, wrapped and centered at the top and bottom with TextLayout. The emoji come from a fallback font, so the caption can mix both.'
  },
  {
    id: 'multilingual-text',
    title: 'Multilingual Text (RTL, Bidi, Indic)',
    description: 'Greetings in several scripts, one renderText() call per line with the same list of fonts: Arabic is shaped right to left with its joining forms, the bidirectional algorithm orders mixed runs, Devanagari forms conjuncts and reorders vowel signs, and emoji come from a color font.'
  },
  {
    id: 'variable-font-axes',
    title: 'Variable Font Axes',
    description: 'One font file, many styles: Roboto Flex rendered across its weight and width axes, plus slant, grade and optical size rows. The instance is picked with the variations option, by axis name (weight, width, slant, opticalSize) or 4-letter tag.'
  },
  {
    id: 'sticker-outline-generator',
    title: 'Sticker Outline Generator',
    sample: 'apple',
    description: 'Gives a cut-out image the classic die-cut sticker look: a thick white outline created by blurring a white silhouette and boosting its alpha, plus a soft drop shadow underneath.'
  },
  {
    id: 'pixel-title-screen',
    title: '8-bit Title Screen',
    sample: 'city-night',
    description: 'An arcade title screen: the photo posterized at 256×144, with text in Press Start 2P (drawn on an 8 px grid, so sizes that are multiples of 8 stay crisp), and everything scaled up 5× with nearest-neighbor so every pixel stays sharp.'
  },
  {
    id: 'opentype-features',
    title: 'OpenType Features',
    description: 'The features option turns OpenType features on (true), off (false) or picks an alternate (a number). Each row shows the same text without and with one: tabular figures, slashed zeros, fractions, inferiors, stylistic sets and character variants in Inter, small caps and lining figures in Playfair Display, and Fira Code\'s ligatures turned off.'
  },
  {
    id: 'quote-card',
    title: 'Quote Card',
    sample: 'landscape',
    description: 'A square social media card: the photo blurred and darkened behind a wrapped, centered quote in Playfair Display, with the author in the font\'s real small caps (the smcp feature) instead of shrunken capitals.'
  },
  {
    id: 'blend-mode-lab',
    title: 'Blend Mode Lab',
    description: 'A 3×2 contact sheet that applies the same color gradient to the image with six different blend modes. Reading order: multiply, screen, overlay, soft-light, difference, color-dodge.'
  },
  {
    id: 'avatar-with-gradient-ring',
    title: 'Avatar with Gradient Ring',
    sample: 'cat',
    description: 'Crops any photo into a feathered circle and wraps it in an antialiased gradient ring, ready to use as a profile picture. Shows cover(), cropCircle(), drawCircle() with a color function and Image.gradient().'
  },
  {
    id: 'font-specimen',
    title: 'Font Specimen: All Bundled Fonts',
    description: 'Every font loadFont() offers, with the id to pass to it and a line of text in the font.'
  }
] as const satisfies readonly Omit<PlaygroundExample, 'code'>[];

const sources = import.meta.glob<string>('../../examples/*.js', { query: '?raw', import: 'default', eager: true });

export const examples: PlaygroundExample[] = exampleList.map((example) => {
  const code = sources[`../../examples/${example.id}.js`];
  if (code === undefined) throw new Error(`examples/${example.id}.js is missing`);
  return { ...example, code };
});
