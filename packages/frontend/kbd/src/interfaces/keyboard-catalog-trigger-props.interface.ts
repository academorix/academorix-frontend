/**
 * @file keyboard-catalog-trigger-props.interface.ts
 * KeyboardCatalogTriggerProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { ReactNode } from "react";

/**
 * Props for {@link KeyboardCatalogTrigger}.
 */
export interface KeyboardCatalogTriggerProps {
  /** Optional class applied to the button. */
  className?: string;
  /** Optional accessible label (defaults to "Keyboard shortcuts"). */
  ariaLabel?: string;
  /** Optional icon override (defaults to a small keyboard glyph). */
  icon?: ReactNode;
}
