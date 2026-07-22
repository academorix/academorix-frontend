/**
 * @fileoverview TanStack Hotkeys adapter utilities.
 *
 * Converts between the {@link KeyCombo} format used by the kbd
 * registry and the string-based hotkey format used by TanStack
 * Hotkeys (e.g. `"Mod+Shift+K"`).
 *
 * @module @stackra/kbd
 * @category Utils
 */

import { Str } from "@stackra/support";

import type { KeyCombo } from "../interfaces/key-combo.interface";

/**
 * Convert a {@link KeyCombo} to a TanStack Hotkeys string.
 *
 * TanStack format: `"Mod+Shift+K"`, `"Alt+Enter"`, `"Escape"`
 *
 * Returns `undefined` for sequence-only combos (those use
 * `registerHotkeySequence` instead).
 *
 * @param combo - The combo to convert.
 * @returns TanStack hotkey string, or `undefined` for sequences.
 */
export function comboToHotkeyString(combo: KeyCombo): string | undefined {
  // Sequence combos are handled separately
  if (combo.sequence && combo.sequence.length > 0) return undefined;
  if (combo.keys) return undefined;
  if (!combo.key) return undefined;

  const parts: string[] = [];

  // TanStack uses "Mod" for platform-aware modifier
  if (combo.mod) parts.push("Mod");
  if (combo.ctrl && !combo.mod) parts.push("Control");
  if (combo.meta && !combo.mod) parts.push("Meta");
  if (combo.alt) parts.push("Alt");
  if (combo.shift) parts.push("Shift");

  // TanStack expects capitalized key names
  parts.push(normalizeKeyForTanStack(combo.key));

  return parts.join("+");
}

/**
 * Convert a TanStack hotkey string back to a {@link KeyCombo}.
 *
 * @param hotkeyStr - TanStack format string (e.g. `"Mod+Shift+K"`).
 * @returns The equivalent KeyCombo.
 */
export function hotkeyStringToCombo(hotkeyStr: string): KeyCombo {
  const parts = hotkeyStr.split("+");
  const combo: KeyCombo = {};

  for (const part of parts) {
    const lower = Str.lower(part);
    switch (lower) {
      case "mod":
        combo.mod = true;
        break;
      case "control":
      case "ctrl":
        combo.ctrl = true;
        break;
      case "meta":
      case "command":
      case "cmd":
        combo.meta = true;
        break;
      case "alt":
      case "option":
        combo.alt = true;
        break;
      case "shift":
        combo.shift = true;
        break;
      default:
        combo.key = Str.lower(part);
        break;
    }
  }

  return combo;
}

/**
 * Convert a sequence array to TanStack's key format.
 *
 * TanStack sequences expect an array of key strings.
 *
 * @param sequence - Array of key names (e.g. `["g", "p"]`).
 * @returns Array formatted for TanStack's `registerHotkeySequence`.
 */
export function sequenceToKeys(sequence: string[]): string[] {
  return sequence.map((k) => normalizeKeyForTanStack(k));
}

/**
 * Normalize a key name for TanStack Hotkeys format.
 *
 * TanStack expects specific casing: single letters uppercase,
 * special keys capitalized (e.g. "Escape", "Enter", "Space").
 */
function normalizeKeyForTanStack(key: string): string {
  const lower = Str.lower(key);

  // Special key mappings
  const SPECIAL_KEYS: Record<string, string> = {
    escape: "Escape",
    esc: "Escape",
    enter: "Enter",
    return: "Enter",
    space: "Space",
    " ": "Space",
    tab: "Tab",
    backspace: "Backspace",
    delete: "Delete",
    del: "Delete",
    up: "ArrowUp",
    arrowup: "ArrowUp",
    down: "ArrowDown",
    arrowdown: "ArrowDown",
    left: "ArrowLeft",
    arrowleft: "ArrowLeft",
    right: "ArrowRight",
    arrowright: "ArrowRight",
    home: "Home",
    end: "End",
    pageup: "PageUp",
    pagedown: "PageDown",
  };

  if (SPECIAL_KEYS[lower]) return SPECIAL_KEYS[lower];

  // Single character keys — uppercase
  if (lower.length === 1) return Str.upper(lower);

  // Function keys
  if (/^f\d+$/.test(lower)) return Str.upper(lower);

  // Default: capitalize first letter
  return Str.ucfirst(lower);
}
