/**
 * @file widget-key-pattern.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Kebab-case validators for widget + cohort keys.
 *
 *   Enforced at registry-`register()` time so a typo (`Kpi-Athletes`,
 *   `numbers_kpi`, `numberKpi`) fails loud at CLI / bootstrap rather
 *   than silently at runtime when the sidebar tries to key on it.
 *
 *   The pattern intentionally allows single-word keys (`numbers`,
 *   `charts`) — unlike the publishable-tag pattern that requires at
 *   least one hyphen — because some cohorts + KPI widgets are one
 *   word and forcing a fake hyphen (`numbers-cohort`) would just
 *   pollute every call site.
 */

/**
 * Kebab-case shape used for both widget keys and cohort keys.
 *
 * Lowercase letters + digits + hyphens; must start with a letter;
 * hyphens only allowed between segments (no leading, trailing, or
 * consecutive hyphens). Single-word keys are permitted.
 *
 * @example
 * ```typescript
 * WIDGET_KEY_PATTERN.test("kpi-athletes"); // true
 * WIDGET_KEY_PATTERN.test("numbers");      // true — single-word OK
 * WIDGET_KEY_PATTERN.test("KpiAthletes");  // false — must be lowercase
 * WIDGET_KEY_PATTERN.test("kpi_athletes"); // false — underscore not allowed
 * WIDGET_KEY_PATTERN.test("-kpi");         // false — leading hyphen
 * WIDGET_KEY_PATTERN.test("kpi--x");       // false — consecutive hyphens
 * ```
 */
export const WIDGET_KEY_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Kebab-case shape used for widget cohort keys.
 *
 * Cohort keys and widget keys share the same shape today — but the
 * two constants stay separate so a future divergence (e.g. cohorts
 * gaining a mandatory prefix) can update one without touching the
 * other.
 */
export const COHORT_KEY_PATTERN = WIDGET_KEY_PATTERN;
