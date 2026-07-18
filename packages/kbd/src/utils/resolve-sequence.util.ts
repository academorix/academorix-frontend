/**
 * @fileoverview resolveSequence — pick the right sequence for the platform.
 *
 * @module @stackra/kbd
 * @category Utils
 */

import type { KeyCombo, PlatformKeys } from "../interfaces/key-combo.interface";

import { isMac } from "./is-mac.util";

import { Str } from "@stackra/support";

/**
 * Resolve the active sequence for the current platform.
 *
 * Resolution order:
 * 1. `combo.sequence` (single sequence shared across platforms).
 * 2. The platform-specific entry from `combo.keys` (`mac` / `windows` /
 *    `linux`).
 * 3. The first non-empty entry from `combo.keys` (when the active
 *    platform isn't represented).
 *
 * Returns `undefined` when no sequence is configured.
 *
 * @param combo - The combo to inspect.
 * @returns The lower-cased sequence array, or `undefined`.
 */
export function resolveSequence(combo: KeyCombo): string[] | undefined {
  if (combo.sequence && combo.sequence.length > 0) {
    return combo.sequence.map((k) => Str.lower(k));
  }

  if (!combo.keys) return undefined;

  const platformKey = detectPlatformKey(combo.keys);
  const seq = combo.keys[platformKey];
  if (seq && seq.length > 0) return seq.map((k) => Str.lower(k));

  const fallback = (Object.values(combo.keys) as Array<string[] | undefined>).find(
    (arr): arr is string[] => Array.isArray(arr) && arr.length > 0,
  );
  return fallback ? fallback.map((k: string) => Str.lower(k)) : undefined;
}

/**
 * Detect the active platform key for {@link PlatformKeys} resolution.
 */
function detectPlatformKey(keys: PlatformKeys): keyof PlatformKeys {
  if (isMac()) return "mac";
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    if (/Win/i.test(navigator.userAgent)) return "windows";
    if (/Linux/i.test(navigator.userAgent)) return "linux";
  }
  return (Object.keys(keys)[0] as keyof PlatformKeys) ?? "linux";
}
