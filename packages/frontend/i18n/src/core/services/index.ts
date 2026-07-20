/**
 * @file index.ts
 * @module @stackra/i18n/core/services
 * @description Barrel export for i18n core services.
 */

export { I18nManager } from "./i18n-manager.service";
export { I18nLocaleService } from "./i18n-locale.service";
export { DirectionService } from "./direction.service";
export { createFormatter } from "./intl-formatter.service";
export type {
  IIntlFormatter,
  IFormatDateOptions,
  IFormatNumberOptions,
  IFormatCurrencyOptions,
  IFormatListOptions,
  RelativeTimeUnit,
  DateStyle,
} from "./intl-formatter.service";
