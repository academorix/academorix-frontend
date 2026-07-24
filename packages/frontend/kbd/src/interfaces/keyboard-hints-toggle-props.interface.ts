/**
 * @file keyboard-hints-toggle-props.interface.ts
 * KeyboardHintsToggleProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

/**
 * Props for {@link KeyboardHintsToggle}.
 */
export interface KeyboardHintsToggleProps {
  /** Optional class applied to the button. */
  className?: string;
  /**
   * Optional accessible label. When omitted, the component resolves
   * the label from the i18n catalog key
   * `kbd.components.keyboard_hints_toggle.aria_label`.
   */
  ariaLabel?: string;
}
