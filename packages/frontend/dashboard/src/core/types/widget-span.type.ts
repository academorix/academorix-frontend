/**
 * @file widget-span.type.ts
 * @module @stackra/dashboard/core/types
 * @description Width hint used by the auto-layout engine to pack widgets
 *   into a responsive grid.
 */

/**
 * Approximate width class.
 *
 * - `full` — occupies the whole row.
 * - `half` — half-width; two widgets fit per row on `lg`.
 * - `third` — one-third; three widgets per row on `lg`.
 */
export type WidgetSpan = "full" | "half" | "third";
