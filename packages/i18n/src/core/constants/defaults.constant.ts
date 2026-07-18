/**
 * @file defaults.constant.ts
 * @module @stackra/i18n/core/constants
 * @description Default values for the i18n runtime — the single source of
 *   truth consumed both directly by the engine and by `mergeConfig`.
 */

import type { II18nConfig } from '../interfaces';

/** Default locale used when nothing else resolves. */
export const DEFAULT_LOCALE = 'en';

/** Default fallback locale used when a translation key is missing. */
export const DEFAULT_FALLBACK_LOCALE = 'en';

/** Default storage key / cookie name for persisting the user's locale. */
export const DEFAULT_STORAGE_KEY = 'stackra_locale';

/** Default separator used to walk nested keys in translation objects. */
export const DEFAULT_KEY_SEPARATOR = '.';

/**
 * Default namespace separator. Off by default — enable by setting a string
 * (e.g. `':'`) so `"auth:login.title"` maps into an `auth` namespace.
 */
export const DEFAULT_NAMESPACE_SEPARATOR: string | false = false;

/** Default opening delimiter for interpolation. */
export const DEFAULT_INTERPOLATION_PREFIX = '{{';

/** Default closing delimiter for interpolation. */
export const DEFAULT_INTERPOLATION_SUFFIX = '}}';

/** Character used to separate a value from its transform pipe(s). */
export const PIPE_SEPARATOR = '|';

/**
 * Built-in transform pipe identifiers accepted in interpolation
 * expressions (e.g. `{{ name | uppercase }}`).
 */
export const TRANSFORM_PIPES = {
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
} as const;

/** CLDR plural category keys accepted by `selectPlural`. */
export const PLURAL_KEYS = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;

/** Base language codes recognised as right-to-left. */
export const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ku']);

/**
 * Fully-resolved default i18n configuration. Composed from the granular
 * defaults above so a single value can be spread by `mergeConfig`.
 */
export const DEFAULT_I18N_CONFIG: II18nConfig = {
  defaultLocale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_FALLBACK_LOCALE,
  supportedLocales: [DEFAULT_LOCALE],
  rtlLocales: Array.from(RTL_LOCALES),
  persistLocale: true,
  storageKey: DEFAULT_STORAGE_KEY,
  keySeparator: DEFAULT_KEY_SEPARATOR,
  nsSeparator: DEFAULT_NAMESPACE_SEPARATOR,
  interpolation: {
    prefix: DEFAULT_INTERPOLATION_PREFIX,
    suffix: DEFAULT_INTERPOLATION_SUFFIX,
  },
  missingKeyBehavior: 'key',
  returnObjects: true,
  logging: true,
};
