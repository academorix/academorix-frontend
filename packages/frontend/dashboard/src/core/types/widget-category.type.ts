/**
 * @file widget-category.type.ts
 * @module @stackra/dashboard/core/types
 * @description Legacy widget category used by the grid-oriented catalogue
 *   ({@link IWidgetDefinition}). Distinct from {@link WidgetCohort},
 *   which drives the newer cohort-based picker. Kept for backward
 *   compatibility with dashboards persisted before the cohort layer
 *   shipped.
 */

/**
 * Category groups a widget definition belongs to in the picker dialog.
 */
export type WidgetCategory =
  "onboarding" | "numbers" | "charts" | "calendar" | "people" | "money" | "compliance";
