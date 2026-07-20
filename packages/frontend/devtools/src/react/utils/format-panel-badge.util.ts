/**
 * @file format-panel-badge.util.ts
 * @module @stackra/devtools/react/utils
 * @description Format a panel's optional badge value for the rail.
 *
 *   Panels can return a `number | string | null` from
 *   `panel.badge()`. The rail renders it inside a HeroUI `Chip`,
 *   which wants a compact string — this util handles the small
 *   niceties: numeric abbreviation via `@stackra/support`'s `Num`,
 *   trimming, and null/undefined coercion.
 */

import { Num, Str } from "@stackra/support";

/**
 * Format a badge value for display in the nav rail.
 *
 * @returns The formatted label, or `null` when the badge is empty.
 */
export function formatPanelBadge(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    // Abbreviate large counts so the chip stays compact — `Num.abbreviate`
    // is the canonical helper per `.kiro/steering/support-utilities.md`.
    return Num.abbreviate(raw);
  }
  const trimmed = Str.trim(raw);
  return trimmed.length > 0 ? trimmed : null;
}
