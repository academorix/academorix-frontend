/**
 * @file language-selector-props.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Props for the `<LanguageSelector />` component.
 */

import type { LocaleItem } from "./locale-item.interface";

/**
 * Props for the `LanguageSelector` component.
 */
export interface LanguageSelectorProps {
  /** Custom label text. Default: no visible label. */
  readonly label?: string;
  /** Custom locale items — falls back to `supportedLocales` with `code` used as name. */
  readonly locales?: LocaleItem[];
  /** Passthrough className for layout composition. */
  readonly className?: string;
  /** Placeholder text. Default: "Select language". */
  readonly placeholder?: string;
}
