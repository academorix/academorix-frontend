/**
 * @file intl-formatter.service.ts
 * @module @stackra/i18n/core/services
 * @description Locale-aware Intl formatting factory. Provides date, number,
 *   currency, relative-time, list, and percent formatting backed by the
 *   built-in `Intl` APIs. Platform-agnostic — works in browser, Node, and
 *   React Native. Consumed by `useFormat()` in `@stackra/i18n/react`.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Human-readable unit strings accepted by the relative-time formatter.
 * Plural forms are normalised to their singular equivalent internally
 * before being passed to `Intl.RelativeTimeFormat`.
 */
export type RelativeTimeUnit =
  | "second"
  | "seconds"
  | "minute"
  | "minutes"
  | "hour"
  | "hours"
  | "day"
  | "days"
  | "week"
  | "weeks"
  | "month"
  | "months"
  | "year"
  | "years";

/** Accepted `dateStyle` presets for quick date formatting. */
export type DateStyle = "full" | "long" | "medium" | "short";

/** Options for the date formatter. */
export interface IFormatDateOptions {
  /** Preset date style (used when `options` is not provided). */
  style?: DateStyle;
  /** Full `Intl.DateTimeFormatOptions` override — takes precedence over `style`. */
  options?: Intl.DateTimeFormatOptions;
}

/** Options for the number formatter. */
export interface IFormatNumberOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  /** Full `Intl.NumberFormatOptions` override. */
  options?: Intl.NumberFormatOptions;
}

/** Options for the currency formatter. */
export interface IFormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** How the currency symbol is rendered. */
  display?: "symbol" | "narrowSymbol" | "code" | "name";
}

/** Options for the list formatter. */
export interface IFormatListOptions {
  style?: "long" | "short" | "narrow";
  type?: "conjunction" | "disjunction" | "unit";
}

/**
 * Locale-bound Intl formatter — every method uses the locale the formatter
 * was created with.
 */
export interface IIntlFormatter {
  /** Format a date value. */
  formatDate(date: Date | number | string, options?: IFormatDateOptions): string;
  /** Format a plain number. */
  formatNumber(value: number, options?: IFormatNumberOptions): string;
  /** Format a currency amount with a currency code (e.g. `"USD"`). */
  formatCurrency(amount: number, currency: string, options?: IFormatCurrencyOptions): string;
  /** Format a relative-time delta (`-2, 'days'` → "2 days ago"). */
  formatRelative(value: number, unit: RelativeTimeUnit): string;
  /** Format a list of strings. */
  formatList(items: string[], options?: IFormatListOptions): string;
  /** Format a percentage. */
  formatPercent(value: number, minimumFractionDigits?: number): string;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a locale-bound formatter instance.
 *
 * Returns all Intl formatting functions bound to the specified locale.
 * Usable in services, email templates, PDF generation — anywhere outside
 * React components. For React components, use the `useFormat()` hook.
 *
 * @param locale - BCP 47 locale tag (e.g., 'en', 'ar-SA', 'fr-FR')
 * @returns Formatter object with all formatting functions
 *
 * @example
 * ```typescript
 * const fmt = createFormatter('ar-SA');
 * fmt.formatCurrency(1500, 'SAR');    // "١٬٥٠٠٫٠٠ ر.س."
 * fmt.formatDate(new Date(), { style: 'long' });
 * fmt.formatRelative(-3, 'days');
 * fmt.formatList(['أحمد', 'محمد', 'فاطمة']);
 * ```
 */
export function createFormatter(locale: string): IIntlFormatter {
  return {
    formatDate(date, options): string {
      const dateObj = toDate(date);
      const intlOptions: Intl.DateTimeFormatOptions = options?.options ?? {
        dateStyle: options?.style ?? "medium",
      };
      return new Intl.DateTimeFormat(locale, intlOptions).format(dateObj);
    },

    formatNumber(value, options): string {
      const intlOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits,
        useGrouping: options?.useGrouping ?? true,
        ...options?.options,
      };
      return new Intl.NumberFormat(locale, intlOptions).format(value);
    },

    formatCurrency(amount, currency, options): string {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: options?.display ?? "symbol",
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits,
      }).format(amount);
    },

    formatRelative(value, unit): string {
      const normalizedUnit = normalizeUnit(unit);
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(value, normalizedUnit);
    },

    formatList(items, options): string {
      return new Intl.ListFormat(locale, {
        style: options?.style ?? "long",
        type: options?.type ?? "conjunction",
      }).format(items);
    },

    formatPercent(value, minimumFractionDigits): string {
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: minimumFractionDigits ?? 0,
      }).format(value);
    },
  };
}

// ============================================================================
// Helpers
// ============================================================================

/** Coerce a date input to a Date object. */
function toDate(input: Date | number | string): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  return new Date(input);
}

/** Normalize plural unit strings to singular (Intl.RelativeTimeFormat requires singular). */
function normalizeUnit(unit: RelativeTimeUnit): Intl.RelativeTimeFormatUnit {
  const mapping: Record<string, Intl.RelativeTimeFormatUnit> = {
    second: "second",
    seconds: "second",
    minute: "minute",
    minutes: "minute",
    hour: "hour",
    hours: "hour",
    day: "day",
    days: "day",
    week: "week",
    weeks: "week",
    month: "month",
    months: "month",
    year: "year",
    years: "year",
  };
  return mapping[unit] ?? "day";
}
