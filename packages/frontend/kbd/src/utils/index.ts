/**
 * @file index.ts
 * Utils Barrel Export
 *
 * @module @stackra/kbd
 * @category Utils
 */

export { isMac } from "./is-mac.util";
export { normalizeKey } from "./normalize-key.util";
export { matchCombo } from "./match-combo.util";
export { formatCombo } from "./format-combo.util";
export type { FormatComboOptions } from "./format-combo.util";
export { isTypingTarget } from "./is-typing-target.util";
export { resolveSequence } from "./resolve-sequence.util";
export {
  comboToCanonical,
  isReservedBrowserCombo,
  RESERVED_BROWSER_COMBOS,
} from "./browser-shortcut-conflicts.util";
export { comboToHotkeyString, hotkeyStringToCombo, sequenceToKeys } from "./tanstack-adapter.util";
