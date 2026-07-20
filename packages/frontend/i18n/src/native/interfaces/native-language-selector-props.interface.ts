/**
 * @file native-language-selector-props.interface.ts
 * @module @stackra/i18n/native/interfaces
 * @description Props for the native language selector component.
 */

import type { NativeLocaleItem } from "./native-locale-item.interface";

/**
 * Props for the `NativeLanguageSelector` component.
 */
export interface NativeLanguageSelectorProps {
  /** Visible label text. */
  readonly label?: string;
  /** Custom locale items. */
  readonly locales?: NativeLocaleItem[];
  /** Additional className (Uniwind). */
  readonly className?: string;
}
