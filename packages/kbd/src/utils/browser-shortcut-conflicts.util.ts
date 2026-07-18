/**
 * @fileoverview Browser & OS shortcut conflict detection.
 *
 * Some keyboard combinations cannot be reliably intercepted from a web
 * page because the browser or operating system claims them at a higher
 * level (e.g. Cmd+T to open a tab, Cmd+Q to quit). Binding to those
 * combos works in some browsers and silently fails in others.
 *
 * This utility ships a curated list of those reserved combos so the
 * registry can warn at registration time. Apps can add their own
 * entries through `KbdModuleOptions.reservedKeys` if they care about a
 * specific browser quirk.
 *
 * @module @stackra/kbd
 * @category Utils
 */

import { Str } from "@stackra/support";

import type { KeyCombo } from "../interfaces/key-combo.interface";

/**
 * Curated set of keyboard combos reserved by browsers and operating systems.
 * Binding to these combos may silently fail in some environments.
 */
export const RESERVED_BROWSER_COMBOS = new Set<string>([
  "mod+t",
  "mod+w",
  "mod+shift+t",
  "mod+n",
  "mod+shift+n",
  "mod+q", // Mac quit
  "mod+m", // Mac minimize
  "mod+l", // address bar focus
  "mod+r", // reload (works in most, blocked in some)
  "mod+shift+r",
  "mod+shift+w",
  // Window management
  "alt+f4",
  "f11", // fullscreen
  "f12", // devtools
  // Tab cycling
  "mod+1",
  "mod+2",
  "mod+3",
  "mod+4",
  "mod+5",
  "mod+6",
  "mod+7",
  "mod+8",
  "mod+9",
  "ctrl+tab",
  "ctrl+shift+tab",
]);

/**
 * Convert a {@link KeyCombo} to a canonical string representation.
 *
 * Used internally by the conflict checker.
 */
export function comboToCanonical(combo: KeyCombo): string {
  if (combo.sequence && combo.sequence.length > 0) {
    return `seq:${combo.sequence.map((k) => Str.lower(k)).join(" ")}`;
  }
  const parts: string[] = [];
  if (combo.mod || combo.meta) parts.push("mod");
  if (combo.ctrl && !combo.mod) parts.push("ctrl");
  if (combo.alt) parts.push("alt");
  if (combo.shift) parts.push("shift");
  if (combo.key) parts.push(Str.lower(combo.key));
  return parts.join("+");
}

/**
 * Check whether a combo is in the reserved list.
 *
 * @param combo - The combo to check.
 * @param extra - Optional additional reserved entries supplied by the app.
 * @returns `true` when the combo conflicts with a known browser / OS shortcut.
 */
export function isReservedBrowserCombo(combo: KeyCombo, extra: readonly string[] = []): boolean {
  const canonical = comboToCanonical(combo);
  if (RESERVED_BROWSER_COMBOS.has(canonical)) return true;
  return extra.includes(canonical);
}
