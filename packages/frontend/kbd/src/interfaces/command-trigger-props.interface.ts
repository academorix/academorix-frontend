/**
 * CommandTriggerProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { KeyCombo } from "./key-combo.interface";

/**
 * Props for {@link CommandTrigger}.
 */
export interface CommandTriggerProps {
  /** Override the displayed combo. Defaults to `Cmd/Ctrl+K`. */
  combo?: KeyCombo;
  /** Optional label rendered before the combo. */
  label?: string;
  /** Optional class applied to the trigger. */
  className?: string;
}
