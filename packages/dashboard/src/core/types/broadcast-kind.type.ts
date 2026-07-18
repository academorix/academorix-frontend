/**
 * @file broadcast-kind.type.ts
 * @module @stackra/dashboard/core/types
 * @description Delivery format for a broadcast token.
 */

/**
 * Delivery format.
 *
 * - `embed` — single dashboard rendered inline, chromeless (historical
 *   `/embed/dashboard/:token` shape).
 * - `present` — full-viewport kiosk slideshow rotating through the
 *   `dashboardIds` list on the configured cadence.
 */
export type BroadcastKind = "embed" | "present";
