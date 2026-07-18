/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Barrel export for i18n interfaces + supporting types.
 */

export type { I18nTranslation } from "./i18n-translation.type";
// NOTE: The i18n path types were renamed from the generic
// `Path` / `PathValue` to the translation-scoped
// `TranslationPath` / `TranslationPathValue` so the config namespace
// (types/config/path.type.ts) can own the top-level barrel names —
// mirrors `@nestjs/config`'s public API surface.
export type { IfAnyOrNever, TranslationPath, TranslationPathValue } from "./path.type";
export type { TranslateOptions } from "./translate-options.interface";
export type { II18nLoader } from "./i18n-loader.interface";
export type { II18nManager } from "./i18n-manager.interface";
export type { II18nLocaleService } from "./i18n-locale-service.interface";
export type { IDirectionService } from "./direction-service.interface";
export type { IDirectionAdapter } from "./direction-adapter.interface";
export type { ILocaleStorage } from "./locale-storage.interface";
export type { ITranslationProvider } from "./translation-provider.interface";
