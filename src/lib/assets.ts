// The sample images and fonts the playground ships (in public/samples and public/fonts): the input picker, the font
// list, the worker's loadSample()/loadFont() and the editor's types all come from here

export interface Sample {
  id: string;
  name: string;
  file: string;
  /** What it's good for, shown as the option's tooltip */
  description: string;
}

export const samples = [
  { id: 'illustration', name: 'Illustration', file: 'illustration.png', description: 'Flat vector-style mountains, 1200×800 PNG' },
  { id: 'landscape', name: 'Landscape', file: 'landscape.jpg', description: 'Mountain lake with reflections, 1200×800 JPEG' },
  { id: 'cat', name: 'Cat', file: 'cat.jpg', description: 'Portrait-oriented close-up with fine fur detail, 800×1000 JPEG' },
  { id: 'dog', name: 'Dog', file: 'dog.jpg', description: 'Labrador outdoors with a soft background, 1200×800 JPEG' },
  { id: 'city-night', name: 'City at night', file: 'city-night.jpg', description: 'Dark scene with bright lights, 1200×800 JPEG' },
  { id: 'apple', name: 'Apple (transparent)', file: 'apple.png', description: 'Cut-out graphic with an alpha channel, 666×800 PNG' },
  { id: 'horse', name: 'Horse in motion (animated GIF)', file: 'horse.gif', description: 'Muybridge\'s 1878 photo sequence, 11 frames, 480×334 GIF: decode it with Animation.decode()' }
] as const satisfies readonly Sample[];

export type SampleId = (typeof samples)[number]['id'];

export interface Font {
  id: string;
  name: string;
  file: string;
  /** Kind of font, shown in the font list */
  category: string;
  /** What to try with it */
  notes: string;
  /** Download size in bytes */
  size: number;
}

export const fonts = [
  { id: 'inter', name: 'Inter', file: 'inter.ttf', category: 'Sans-serif, variable', size: 876576, notes: 'Weight and optical size axes; features like tnum, zero, frac, sinf, ss01-ss08, cv01-cv14' },
  { id: 'roboto-flex', name: 'Roboto Flex', file: 'roboto-flex.ttf', category: 'Sans-serif, variable', size: 1787292, notes: '13 axes: weight, width, slant, optical size, grade and parametric ones (XTRA, YOPQ, …)' },
  { id: 'playfair-display', name: 'Playfair Display', file: 'playfair-display.ttf', category: 'Serif, variable', size: 300724, notes: 'High-contrast display serif; weight axis, small caps (smcp), old-style figures by default (lnum for lining ones)' },
  { id: 'fira-code', name: 'Fira Code', file: 'fira-code.ttf', category: 'Monospace, variable', size: 260364, notes: 'Programming ligatures (=> != <= ->), turn off with { calt: false }' },
  { id: 'caveat', name: 'Caveat', file: 'caveat.ttf', category: 'Handwriting, variable', size: 403648, notes: 'Casual marker handwriting; weight axis, contextual alternates (calt), stylistic sets ss01 and ss02' },
  { id: 'press-start-2p', name: 'Press Start 2P', file: 'press-start-2p.ttf', category: 'Pixel', size: 118204, notes: '8-bit arcade lettering on an 8 px grid: use multiples of 8 px for crisp edges' },
  { id: 'noto-naskh-arabic', name: 'Noto Naskh Arabic', file: 'noto-naskh-arabic.ttf', category: 'Arabic', size: 307592, notes: 'Right-to-left text, joining forms, marks; mixes with Latin (bidi)' },
  { id: 'noto-sans-devanagari', name: 'Noto Sans Devanagari', file: 'noto-sans-devanagari.ttf', category: 'Devanagari', size: 641944, notes: 'Hindi, Marathi, Sanskrit: conjuncts and reordered vowel signs; weight and width axes' },
  { id: 'noto-color-emoji', name: 'Noto Color Emoji', file: 'noto-color-emoji.ttf', category: 'Emoji (COLRv1)', size: 5038236, notes: 'Gradients and layered vector glyphs; ZWJ sequences, skin tones, flags' },
  { id: 'twemoji', name: 'Twemoji', file: 'twemoji.ttf', category: 'Emoji (COLRv0)', size: 1474284, notes: 'Flat layered color glyphs (Mozilla\'s Twemoji build)' }
] as const satisfies readonly Font[];

export type FontId = (typeof fonts)[number]['id'];
