/**
 * KeyboardShortcutProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { KeyCombo } from "./key-combo.interface";

/**
 * Props for {@link KeyboardShortcut}.
 */
export interface KeyboardShortcutProps {
  /** The combo to render. */
  combo: KeyCombo;
  /** Optional class applied to the wrapper `<Kbd>`. */
  className?: string;
}
