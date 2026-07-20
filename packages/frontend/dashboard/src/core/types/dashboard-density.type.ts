/**
 * @file dashboard-density.type.ts
 * @module @stackra/dashboard/core/types
 * @description Spacing density preset applied to the dashboard canvas.
 *   Sits orthogonal to {@link DashboardLayoutMode} — layout mode picks
 *   shape, density picks breathing room.
 */

/**
 * Spacing density preset.
 *
 * - `compact` — tightest grid gaps, information-dense.
 * - `cozy` — balanced default; reads well at 1440px without cramping.
 * - `comfortable` — extra breathing room for projected slideshows.
 *
 * Read paths treat `undefined` as `"cozy"` so documents written before
 * the field shipped keep rendering unchanged.
 */
export type DashboardDensity = "compact" | "cozy" | "comfortable";
