/**
 * @file use-format-return.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Return type of `useFormat()`.
 */

import type { IIntlFormatter } from "../services";

/**
 * Return type of `useFormat()` — an `IIntlFormatter` extended with the
 * currently active locale.
 */
export interface IUseFormatReturn extends IIntlFormatter {
  /** The locale the formatter is currently bound to. */
  readonly locale: string;
}
