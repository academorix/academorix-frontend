/**
 * @fileoverview matchCombo — predicate that checks an event against a combo.
 *
 * @module @stackra/kbd
 * @category Utils
 */

import type { KeyCombo } from "../interfaces/key-combo.interface";

import { isMac } from "./is-mac.util";
import { normalizeKey } from "./normalize-key.util";

/**
 * Compare a {@link KeyCombo} against a native `KeyboardEvent`.
 *
 * Handles platform-aware `mod` translation, modifier matching, and
 * case-insensitive key comparison. `sequence` combos are matched by
 * the sequence tracker — this function only handles single-key combos.
 *
 * @param combo - The combo to match against.
 * @param event - The native keyboard event.
 * @returns `true` when the event matches the combo.
 */
export function matchCombo(combo: KeyCombo, event: KeyboardEvent): boolean {
  if (combo.sequence && combo.sequence.length > 0) return false;
  if (!combo.key) return false;

  if (normalizeKey(event.key) !== normalizeKey(combo.key)) return false;

  const mac = isMac();
  const modPressed = mac ? event.metaKey : event.ctrlKey;

  // `mod` must hold platform-aware
  if (combo.mod !== undefined && !!combo.mod !== modPressed) return false;
  if (combo.ctrl !== undefined && !!combo.ctrl !== event.ctrlKey) return false;
  if (combo.meta !== undefined && !!combo.meta !== event.metaKey) return false;
  if (combo.alt !== undefined && !!combo.alt !== event.altKey) return false;
  if (combo.shift !== undefined && !!combo.shift !== event.shiftKey) return false;

  return true;
}
