/**
 * @file history-on-back.type.ts
 * @module @stackra/contracts/interfaces/routing
 * @description The union of shapes accepted by `IRouteHistory.onBack`.
 */

/**
 * Back-button interception strategy for a route.
 *
 * - `'default'` — no interception (browser back is used).
 * - `'to-parent'` — navigate to the parent route in the match chain;
 *   falls back to `/` when there is no parent.
 * - `number` — negative goes back N entries (`router.go(-N)`);
 *   positive goes forward.
 * - `string` — absolute path to navigate to (replace-mode).
 */
export type IHistoryOnBack = "default" | "to-parent" | number | string;
