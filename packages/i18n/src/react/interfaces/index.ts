/**
 * @file index.ts
 * @module @stackra/i18n/react/interfaces
 * @description Barrel export for react-subpath interfaces (component props
 *   + resolver options). Cross-platform hook return types
 *   (`UseI18nReturn`, `UseLocaleReturn`, `UseDirectionReturn`,
 *   `IUseFormatReturn`) live in `../../core/interfaces` and are
 *   re-exported here so consumers can `import { UseI18nReturn } from
 *   '@stackra/i18n/react'`.
 */

// ── Component props ────────────────────────────────────────────────────
export type { LanguageSelectorProps } from './language-selector-props.interface';
export type { LanguageToggleOption } from './language-toggle-option.interface';
export type { LanguageToggleProps } from './language-toggle-props.interface';
export type { LocaleItem } from './locale-item.interface';

// ── Resolver options ───────────────────────────────────────────────────
export type { CookieResolverOptions } from './cookie-resolver-options.interface';
export type { LocalStorageResolverOptions } from './local-storage-resolver-options.interface';
export type { SubdomainResolverOptions } from './subdomain-resolver-options.interface';
export type { UrlParamResolverOptions } from './url-param-resolver-options.interface';

// ── Cross-platform hook return types (re-exported from core) ───────────
export type {
  UseI18nReturn,
  UseLocaleReturn,
  UseDirectionReturn,
  IUseFormatReturn,
} from '@/core/interfaces';
