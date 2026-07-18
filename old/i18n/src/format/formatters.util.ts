/**
 * @file formatters.util.ts
 * @module @academorix/i18n/format/formatters.util
 *
 * @description
 * Thin wrappers around `Intl.*` formatters that resolve a BCP-47 tag
 * from an app's {@link I18nConfig}. Every helper is a pure function —
 * no React, no state — so they're safe to call from Server Components,
 * hooks, and vanilla code alike.
 *
 * The helpers deliberately accept a resolved BCP-47 tag rather than a
 * `Locale` union so they don't have to import an app-specific type.
 * Consumers typically read `config.bcp47[locale]` at the call site.
 *
 * @example
 * ```ts
 * import { formatDate, formatNumber } from "@academorix/i18n/format";
 * import { i18nConfig } from "@/config/i18n.config";
 * import { useLocale } from "@/lib/i18n";
 *
 * function DateCell({ value }: { value: string }) {
 *   const { locale } = useLocale();
 *   const tag = i18nConfig.bcp47[locale];
 *
 *   return <span>{formatDate(new Date(value), tag)}</span>;
 * }
 * ```
 */

/** Input accepted by every date formatter. */
export type DateInput = Date | string | number;

/** Options for {@link formatDate}. */
export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  /** Overrides the timezone read from the runtime env. */
  timeZone?: string;
}

/**
 * Coerces every accepted input to a Date. Returns `null` for invalid
 * inputs so callers can render a fallback rather than "Invalid Date".
 */
function toDate(input: DateInput): Date | null {
  const date = input instanceof Date ? input : new Date(input);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date via `Intl.DateTimeFormat`. Returns an empty string
 * when the input is invalid so upstream UI never renders "Invalid Date".
 *
 * @param input - Date instance, ISO string, or epoch ms.
 * @param bcp47 - BCP-47 locale tag (e.g. `"en-US"`, `"ar-EG"`).
 * @param options - Standard `Intl.DateTimeFormatOptions` (dateStyle, etc.).
 */
export function formatDate(
  input: DateInput,
  bcp47: string,
  options: FormatDateOptions = { dateStyle: "medium" },
): string {
  const date = toDate(input);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(bcp47, options).format(date);
}

/**
 * Formats a Date/time together via `Intl.DateTimeFormat` with sensible
 * defaults (medium date + short time).
 */
export function formatDateTime(
  input: DateInput,
  bcp47: string,
  options: FormatDateOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  return formatDate(input, bcp47, options);
}

/**
 * Formats a number via `Intl.NumberFormat`. Non-finite inputs return
 * an empty string.
 */
export function formatNumber(
  value: number,
  bcp47: string,
  options: Intl.NumberFormatOptions = {},
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat(bcp47, options).format(value);
}

/**
 * Formats a monetary value with the given ISO 4217 currency code.
 * A trivial specialization of {@link formatNumber} — kept as its own
 * export because currency formatting is easy to get wrong (locale
 * conventions vary in decimal count, currency-symbol position, etc.).
 */
export function formatCurrency(
  value: number,
  bcp47: string,
  currency: string,
  options: Omit<Intl.NumberFormatOptions, "style" | "currency"> = {},
): string {
  return formatNumber(value, bcp47, { style: "currency", currency, ...options });
}

/**
 * Formats a relative time (e.g. `"2 hours ago"`, `"in 3 days"`) via
 * `Intl.RelativeTimeFormat`. Auto-picks the best unit (year down to
 * second) based on the delta.
 *
 * @param input - Target date; the reference is `now` unless overridden.
 * @param bcp47 - BCP-47 locale tag.
 * @param options - `numeric: "auto"` gives "yesterday"; `"always"`
 *   gives "1 day ago". Default `"auto"`.
 * @param now - Reference time. Defaults to the current wall clock.
 */
export function formatRelativeTime(
  input: DateInput,
  bcp47: string,
  options: Intl.RelativeTimeFormatOptions = { numeric: "auto" },
  now: Date = new Date(),
): string {
  const date = toDate(input);

  if (!date) {
    return "";
  }

  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat(bcp47, options);

  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of ranges) {
    if (abs >= secondsInUnit || unit === "second") {
      return formatter.format(Math.round(seconds / secondsInUnit), unit);
    }
  }

  return formatter.format(0, "second");
}

/**
 * Formats a list of strings in the locale's canonical style
 * (e.g. English: `"A, B, and C"`; Arabic: `"A، B، وC"`). Wraps
 * `Intl.ListFormat`.
 */
export function formatList(
  items: readonly string[],
  bcp47: string,
  options: Intl.ListFormatOptions = { type: "conjunction", style: "long" },
): string {
  return new Intl.ListFormat(bcp47, options).format(items);
}
