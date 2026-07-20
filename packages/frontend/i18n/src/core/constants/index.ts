/**
 * @file index.ts
 * @module @stackra/i18n/core/constants
 * @description Barrel export for i18n constants + the package-local DI token.
 *
 *   Cross-package i18n tokens and events live in `@stackra/contracts`.
 */

export {
  DEFAULT_LOCALE,
  DEFAULT_FALLBACK_LOCALE,
  DEFAULT_STORAGE_KEY,
  DEFAULT_KEY_SEPARATOR,
  DEFAULT_NAMESPACE_SEPARATOR,
  DEFAULT_INTERPOLATION_PREFIX,
  DEFAULT_INTERPOLATION_SUFFIX,
  PIPE_SEPARATOR,
  TRANSFORM_PIPES,
  PLURAL_KEYS,
  RTL_LOCALES,
  DEFAULT_I18N_CONFIG,
} from './defaults.constant';

export { I18N_CONFIG } from './tokens.constant';
