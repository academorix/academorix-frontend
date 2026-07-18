/**
 * @file locale.interface.ts
 * @module @academorix/dashboard/services/locale
 * @description Reactive snapshot for {@link LocaleService}.
 */

import type { Locale } from "@/i18n/config";

/** Reactive state of the locale layer. */
export interface ILocaleSnapshot {
  /** The active locale (`"en"` / `"ar"` / …). */
  readonly locale: Locale;
  /** The text direction implied by the locale. */
  readonly dir: "ltr" | "rtl";
}
