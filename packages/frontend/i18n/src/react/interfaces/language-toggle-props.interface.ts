/**
 * @file language-toggle-props.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Props for the `<LanguageToggle />` component.
 */

import type { LanguageToggleOption } from './language-toggle-option.interface';

/**
 * Props for the `LanguageToggle` component.
 */
export interface LanguageToggleProps {
  /** Toggle options. Falls back to `supportedLocales` (uppercase code). */
  readonly options?: LanguageToggleOption[];
  /** Passthrough className for layout composition. */
  readonly className?: string;
}
