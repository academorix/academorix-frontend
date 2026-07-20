/**
 * @file index.ts
 * @module @stackra/i18n/core/interfaces
 * @description Barrel export for package-owned i18n interfaces.
 *
 *   Cross-package contracts (`II18nManager`, `II18nLocaleService`,
 *   `IDirectionService`, `IDirectionAdapter`, `ILocaleStorage`,
 *   `ITranslationProvider`, `II18nLoader`, `TranslateOptions`,
 *   `I18nTranslation`, `Path`, `PathValue`, `IfAnyOrNever`) live in
 *   `@stackra/contracts` and are imported from there directly.
 */

export type { I18nFallbacks, I18nInterpolation, II18nConfig } from './i18n-config.interface';
export type { I18nFeatureOptions } from './i18n-feature-options.interface';
export type { I18nPluralObject } from './i18n-plural-object.interface';
export type {
  II18nResolver,
  II18nAsyncResolver,
  I18nResolverConfig,
} from './i18n-resolver.interface';
export type { II18nState } from './i18n-state.interface';
export type { II18nStore } from './i18n-store.interface';
export type { II18nSyncProvider } from './i18n-sync-provider.interface';
export type { MissingKeysReport } from './missing-keys-report.interface';
export type { StaticLoaderOptions } from './static-loader-options.interface';
export type { HttpLoaderOptions } from './http-loader-options.interface';
export type { DynamicImportLoaderOptions } from './dynamic-import-loader-options.interface';
export type { TypeGeneratorOptions } from './type-generator-options.interface';
export type { UseI18nReturn } from './use-i18n-return.interface';
export type { UseLocaleReturn } from './use-locale-return.interface';
export type { UseDirectionReturn } from './use-direction-return.interface';
export type { IUseFormatReturn } from './use-format-return.interface';
