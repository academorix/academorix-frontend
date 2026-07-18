/**
 * @fileoverview formatCombo — render a KeyCombo as a printable string.
 *
 * Uses TanStack Hotkeys' `formatForDisplay` for platform-aware
 * rendering (⌘⇧S on Mac, Ctrl+Shift+S on Windows). Falls back to
 * manual formatting for sequence combos.
 *
 * @module @stackra/kbd
 * @category Utils
 */

import { formatForDisplay } from "@tanstack/react-hotkeys";
import { Str } from "@stackra/support";

import type { KeyCombo } from "../interfaces/key-combo.interface";
import { comboToHotkeyString } from "./tanstack-adapter.util";

/**
 * Format a {@link KeyCombo} as a human-readable string.
 *
 * Uses TanStack Hotkeys' `formatForDisplay` for single-key combos,
 * providing platform-aware glyphs (⌘ ⇧ on macOS, Ctrl+Shift on
 * Windows/Linux). Sequence combos are formatted as space-separated
 * uppercase keys.
 *
 * @param combo - The combo to format.
 * @param options - Formatting options.
 * @returns The printable string (e.g. `"⌘K"`, `"Ctrl+Shift+P"`, `"G P"`).
 */
export function formatCombo(combo: KeyCombo, options: FormatComboOptions = {}): string {
  // Sequence combos — format as space-separated keys
  if (combo.sequence && combo.sequence.length > 0) {
    return combo.sequence.map((k) => Str.upper(k)).join(options.sequenceSeparator ?? " ");
  }

  // Platform-specific sequences
  if (combo.keys) {
    const isMacPlatform =
      typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const seq = isMacPlatform ? combo.keys.mac : (combo.keys.windows ?? combo.keys.linux);
    if (seq && seq.length > 0) {
      return seq.map((k) => Str.upper(k)).join(options.sequenceSeparator ?? " ");
    }
  }

  // Single-key combos — use TanStack's formatForDisplay
  const hotkeyStr = comboToHotkeyString(combo);
  if (hotkeyStr) {
    return formatForDisplay(hotkeyStr, {
      platform: options.platform,
    });
  }

  // Fallback
  return combo.key ? Str.upper(combo.key) : "";
}

/**
 * Options for {@link formatCombo}.
 */
export interface FormatComboOptions {
  /**
   * Target platform for formatting.
   *
   * When omitted, auto-detects the current platform.
   */
  platform?: "mac" | "windows" | "linux";

  /**
   * Separator between keys in a sequence.
   *
   * @default " "
   */
  sequenceSeparator?: string;
}
