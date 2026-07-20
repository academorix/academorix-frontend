/**
 * @file index.ts
 * @module @stackra/i18n/react/hooks
 * @description Re-export the cross-platform hooks from `core/hooks` (per
 *   the workspace rule for hooks shared between react + native subpaths).
 *   Return-type interfaces live in `../../core/interfaces` and are
 *   re-exported by the react interfaces barrel for consumer convenience.
 */

export { useI18n, useLocale, useDirection, useFormat } from "@/core/hooks";

// Re-export formatter types for direct hook consumers who don't
// reach the react/interfaces barrel.
export type {
  IFormatDateOptions,
  IFormatNumberOptions,
  IFormatCurrencyOptions,
  IFormatListOptions,
  RelativeTimeUnit,
  IIntlFormatter,
  DateStyle,
} from "@/core/services/intl-formatter.service";
export type {
  IUseFormatReturn,
  UseI18nReturn,
  UseLocaleReturn,
  UseDirectionReturn,
} from "@/core/interfaces";
