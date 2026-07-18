/**
 * @file widget-cohort-registry.token.ts
 * @module @stackra/dashboard/core/tokens
 * @description DI token binding to the singleton
 *   {@link WidgetCohortRegistry}.
 */

/**
 * Symbol token for the singleton {@link WidgetCohortRegistry}.
 */
export const WIDGET_COHORT_REGISTRY: unique symbol = Symbol.for(
  "@stackra/dashboard/WIDGET_COHORT_REGISTRY",
);
