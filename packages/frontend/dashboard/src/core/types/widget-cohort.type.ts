/**
 * @file widget-cohort.type.ts
 * @module @stackra/dashboard/core/types
 * @description Widget cohort — the category bucket a widget lives under
 *   in the picker sidebar. The union stays open (`| (string & {})`) so
 *   feature modules can register additional cohorts at boot without a
 *   shared type edit.
 */

/**
 * Widget cohort key.
 *
 * The seven canonical cohorts ship with the package; the union stays
 * open so `WidgetCatalogueService.registerCohort(...)` can slot in a
 * new bucket at boot. Concrete literals win in IntelliSense; arbitrary
 * strings still pass the type checker.
 */
export type WidgetCohort =
  | "onboarding"
  | "numbers"
  | "charts"
  | "calendar"
  | "people"
  | "money"
  | "compliance"
  | "custom"
  // The `(string & {})` idiom keeps IDEs auto-completing the canonical
  // cohorts while still admitting any string a module registers at boot.
  | (string & {});
