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
  /**
   * Optional accessible label. When omitted, the component resolves
   * the label from the i18n catalog key
   * `kbd.components.keyboard_catalog_trigger.aria_label`.
   */
  ariaLabel?: string;
  /** Optional icon override (defaults to a small keyboard glyph). */
  icon?: ReactNode;
}
