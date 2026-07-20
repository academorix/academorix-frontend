/**
 * @file type-generator-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description TypeGeneratorOptions interface.
 */

/**
 * Options for the type generator.
 */
export interface TypeGeneratorOptions {
  /** Path to the translations directory (contains locale folders with JSON files). */
  translationsPath: string;
  /** Output path for the generated .d.ts file. */
  outputPath: string;
  /** Whether to watch for changes. Default: false */
  watch?: boolean;
}
