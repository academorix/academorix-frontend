/**
 * @file index.ts
 * @module @stackra/i18n
 * @description Public API for the core `@stackra/i18n` runtime — platform-
 *   agnostic translation, locale management, direction service, pluggable
 *   loaders, interpolation, pluralization, and type-safe keys.
 *
 *   Cross-package contracts (`I18N_MANAGER`, `II18nManager`, `II18nLoader`,
 *   `I18nTranslation`, `Path`, `PathValue`, `TranslateOptions`, …) live in
 *   `@stackra/contracts` and are imported from there directly. This barrel
 *   only exports symbols this package owns.
 */

// ============================================================================
// Module
// ============================================================================

export { I18nModule } from "./i18n.module";

// ============================================================================
// Adapters (cross-platform)
// ============================================================================

export { StorageBackedLocaleAdapter } from "./adapters";

// ============================================================================
// Services
// ============================================================================

export { I18nManager, I18nLocaleService, DirectionService } from "./services";
export { createFormatter } from "./services";
export type {
  IIntlFormatter,
  IFormatDateOptions,
  IFormatNumberOptions,
  IFormatCurrencyOptions,
  IFormatListOptions,
  RelativeTimeUnit,
  DateStyle,
} from "./services";

// ============================================================================
// Loaders
// ============================================================================

export { StaticLoader, DynamicImportLoader, HttpLoader } from "./loaders";

// ============================================================================
// Providers
// ============================================================================

export { NullTranslationProvider } from "./providers";

// ============================================================================
// Interfaces (package-owned)
// ============================================================================

export type {
  II18nConfig,
  I18nFallbacks,
  I18nInterpolation,
  I18nFeatureOptions,
  I18nPluralObject,
  II18nResolver,
  II18nAsyncResolver,
  I18nResolverConfig,
  II18nState,
  II18nStore,
  II18nSyncProvider,
  MissingKeysReport,
  StaticLoaderOptions,
  HttpLoaderOptions,
  DynamicImportLoaderOptions,
  TypeGeneratorOptions,
} from "./interfaces";

// ============================================================================
// Types (package-owned)
// ============================================================================

export type { ExportFormat } from "./types";

// ============================================================================
// Constants
// ============================================================================

export {
  I18N_CONFIG,
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
} from "./constants";

// ============================================================================
// Utilities
//
// Only isomorphic utilities land here. `generateI18nTypes` (type
// codegen from translation files) reads from disk via `node:fs` and so
// lives at `@stackra/i18n/vite` — the build-time subpath. Re-exporting
// it here would drag `fs` / `path` into every client bundle that
// imports from `@stackra/i18n` and blow up in Vite's browser
// environment ("Module 'fs' has been externalized for browser
// compatibility").
// ============================================================================

export {
  defineConfig,
  mergeConfig,
  interpolate,
  getPluralObject,
  selectPlural,
  resolveLanguage,
  getNextFallbackLanguage,
  mergeDeep,
  isRtlLocale,
  getDirection,
} from "./utils";
