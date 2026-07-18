/**
 * @file get-assets-generator-config-input.interface.ts
 * @module @stackra/pwa/vite/interfaces
 * @description Input shape for `getAssetsGeneratorConfig(input)`.
 */

/**
 * Input passed to `getAssetsGeneratorConfig`.
 *
 * `@vite-pwa/assets-generator` reads a preset config that describes
 * how to derive every PWA icon + iOS startup image from a single
 * source SVG or PNG. This builder emits the config in the shape the
 * generator's programmatic API accepts.
 */
export interface IGetAssetsGeneratorConfigInput {
  /**
   * Source image (SVG or PNG ≥ 512x512) used to derive every icon
   * + Apple splash image.
   */
  readonly source: string;
  /**
   * Preset the generator uses to decide which sizes to emit.
   * `'minimal-2023'` is the current mainstream preset that ships
   * 64/192/512 pngs + maskable + apple-touch icons.
   *
   * @default 'minimal-2023'
   */
  readonly preset?: 'minimal-2023' | 'minimal' | 'nothing';
  /**
   * Directory (relative to the app's `public/`) the emitted images
   * are placed under.
   *
   * @default 'public/'
   */
  readonly outDir?: string;
  /**
   * Extra image outputs to append beyond the preset baseline —
   * useful for adding a favicon.ico or extra icons for TWA.
   */
  readonly extra?: readonly {
    readonly src: string;
    readonly sizes: string;
    readonly type: string;
    readonly purpose?: string;
  }[];
}
