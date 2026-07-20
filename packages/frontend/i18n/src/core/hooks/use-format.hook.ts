/**
 * @file use-format.hook.ts
 * @module @stackra/i18n/react/hooks
 * @description React hook for locale-aware Intl formatting.
 *   Provides date, number, currency, relative time, list, and percent
 *   formatters that automatically react to locale changes.
 */

import { useMemo } from "react";
import { useInject } from "@stackra/container/react";
import { I18N_LOCALE_SERVICE } from "@stackra/contracts";

import type { I18nLocaleService } from "../services/i18n-locale.service";
import { createFormatter } from "../services/intl-formatter.service";
import type { IUseFormatReturn } from "../interfaces";

/**
 * React hook for locale-aware Intl formatting.
 *
 * Returns formatting functions that are automatically bound to the current
 * locale. When the locale changes (via `setLocale`), all formatted outputs
 * update on the next render.
 *
 * @returns Locale-bound formatting functions
 *
 * @example
 * ```typescript
 * function PriceTag({ amount }: { amount: number }) {
 *   const { formatCurrency, formatRelative } = useFormat();
 *   return (
 *     <div>
 *       <span>{formatCurrency(amount, 'USD')}</span>
 *       <small>{formatRelative(-2, 'hours')}</small>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormat(): IUseFormatReturn {
  const localeService = useInject<I18nLocaleService>(I18N_LOCALE_SERVICE);
  const locale = localeService.getLocale();

  // Recreate formatter only when locale changes
  const formatter = useMemo(() => createFormatter(locale), [locale]);

  return {
    locale,
    ...formatter,
  };
}

// Re-export types for convenience so consumers can `import { RelativeTimeUnit } from '@stackra/i18n/react'`.
export type {
  IFormatDateOptions,
  IFormatNumberOptions,
  IFormatCurrencyOptions,
  IFormatListOptions,
  RelativeTimeUnit,
  IIntlFormatter,
  DateStyle,
} from "../services/intl-formatter.service";

export type { IUseFormatReturn } from "@/react/interfaces";
