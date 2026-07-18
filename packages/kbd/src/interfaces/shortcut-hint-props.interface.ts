/**
 * ShortcutHintProps — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { ReactElement } from "react";

import type { KeyCombo } from "./key-combo.interface";

/**
 * Props for {@link ShortcutHint}.
 */
export interface ShortcutHintProps {
  /** The combo bound to the wrapped element. */
  combo: KeyCombo;
  /** Single child element. The combo is encoded into `data-shortcut`. */
  children: ReactElement;
  /** Optional human-readable description (rendered as `data-shortcut-description`). */
  description?: string;
}
