/**
 * @file get-assets-generator-config.util.ts
 * @module @stackra/pwa/vite/utils
 * @description Build a config for `@vite-pwa/assets-generator`.
 *
 *   The generator is a build-time tool that emits every PWA icon and
 *   iOS startup image from a single source image. This helper emits
 *   the config object its programmatic API accepts — the caller casts
 *   at the call site (we don't hard-depend on the generator's types).
 */

import type { IGetAssetsGeneratorConfigInput } from '../interfaces';

/**
 * Compose a `@vite-pwa/assets-generator` config.
 *
 * @param input - Source image + preset + optional extras.
 * @returns The config object typed as `Record<string, unknown>`.
 *
 * @example
 * ```typescript
 * // scripts/generate-pwa-assets.ts
 * import { generateAssets } from '@vite-pwa/assets-generator';
 * import { getAssetsGeneratorConfig } from '@stackra/pwa/vite';
 *
 * await generateAssets(getAssetsGeneratorConfig({
 *   source: './public/logo.svg',
 *   preset: 'minimal-2023',
 * }) as never);
 * ```
 */
export function getAssetsGeneratorConfig(
  input: IGetAssetsGeneratorConfigInput
): Record<string, unknown> {
  const { source, preset = 'minimal-2023', outDir = 'public/', extra } = input;

  return {
    preset,
    // The `images` field takes an array of source images. Modern
    // assets-generator versions accept a plain `string` too, but the
    // array shape works across every version we support.
    images: [source],
    // Emit outputs relative to the repo root. Consumers override by
    // wiring their own `outputPath` inside `workboxExtras`.
    outDir,
    // Optional extra icons appended verbatim to the generated set.
    ...(extra ? { extra: [...extra] } : {}),
  };
}
