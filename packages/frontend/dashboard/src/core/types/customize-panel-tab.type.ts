/**
 * @file customize-panel-tab.type.ts
 * @module @stackra/dashboard/core/types
 * @description The five inspector tabs the customise panel exposes.
 *   Kept as a literal union so the tab registry stays type-checked.
 *
 *   `history` sits between `settings` and `filters` so the ordering
 *   matches the user's mental grouping: shape → identity → history →
 *   filters.
 */

/**
 * Customise-panel tab identifier.
 */
export type CustomizePanelTab = "widgets" | "layout" | "settings" | "history" | "filters";
