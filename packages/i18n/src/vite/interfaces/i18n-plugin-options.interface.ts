/**
 * @file i18n-plugin-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description I18nPluginOptions interface.
 */

/**
 * Options for the i18n Vite plugin.
 */
export interface I18nPluginOptions {
  /** Path to the translations directory (relative to project root). */
  translationsDir: string;
  /** File extension to scan for. Default: '.json' */
  fileExtension?: string;
}
