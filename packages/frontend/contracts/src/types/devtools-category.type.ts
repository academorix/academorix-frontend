/**
 * @file devtools-category.type.ts
 * @module @stackra/contracts/types
 * @description Category union for a devtools panel — governs the rail
 *   grouping order in the devtools shell.
 */

/**
 * Devtools panel category. The shell renders panels grouped by this
 * value in the canonical order:
 *
 * `pinned → app → framework → data → ui → network → observability → modules`.
 *
 * The default when omitted is `'modules'`.
 */
export type DevtoolsCategory =
  "pinned" | "app" | "framework" | "data" | "ui" | "network" | "observability" | "modules";
