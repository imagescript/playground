// The globals user code gets (see playground.worker.ts), as declarations for the editor and scripts/check-examples.mjs
// (which imports this file with Node's type stripping: keep the imports' .ts extensions)
import { fonts, samples } from './assets.ts';

export const playgroundGlobals = `
declare const Image: typeof import('imagescript').Image;
declare const Animation: typeof import('imagescript').Animation;
declare const AnimationEncoder: typeof import('imagescript').AnimationEncoder;
declare const Frame: typeof import('imagescript').Frame;
declare const GIF: typeof import('imagescript').GIF;
declare const ImageType: typeof import('imagescript').ImageType;
declare const TextLayout: typeof import('imagescript').TextLayout;
declare const decode: typeof import('imagescript').decode;
/** The input image's file: the selected sample or the uploaded image */
declare const input: Uint8Array;
/**
 * Loads one of the playground's fonts (TrueType), for Image.renderText() or renderSVG()'s fonts:
${fonts.map((font) => ` * - '${font.id}': ${font.name} (${font.category}, ${(font.size / 1048576).toFixed(1)} MB): ${font.notes}`).join('\n')}
 */
declare function loadFont(id: ${fonts.map((font) => `'${font.id}'`).join(' | ')}): Promise<Uint8Array>;
/**
 * Loads one of the sample images (the encoded file), e.g. to combine it with the input:
${samples.map((sample) => ` * - '${sample.id}': ${sample.description}`).join('\n')}
 */
declare function loadSample(id: ${samples.map((sample) => `'${sample.id}'`).join(' | ')}): Promise<Uint8Array>;
`;
