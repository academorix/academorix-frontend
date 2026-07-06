/**
 * @file index.ts
 * @module @academorix/i18n/format
 *
 * @description
 * Public barrel for `Intl.*`-backed formatters. Every helper is a pure
 * function — safe for Server Components, hooks, and vanilla code.
 */

export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatRelativeTime,
} from "./formatters.util";

export type { DateInput, FormatDateOptions } from "./formatters.util";
