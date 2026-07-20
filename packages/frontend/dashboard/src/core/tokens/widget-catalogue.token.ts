/**
 * @file widget-catalogue.token.ts
 * @module @stackra/dashboard/core/tokens
 * @description DI token binding to the singleton widget catalogue
 *   service.
 */

/**
 * Symbol token for the widget catalogue service.
 */
export const WIDGET_CATALOGUE_SERVICE: unique symbol = Symbol.for(
  "@stackra/dashboard/WIDGET_CATALOGUE_SERVICE",
);
