/**
 * @file tokens.constant.ts
 * @module @stackra/scope/core/constants
 * @description DI tokens owned by the scope package.
 *
 *   `SCOPE_SERVICE` lives canonically in `@stackra/contracts` — import
 *   it directly from there. Only tokens that are NOT already published
 *   through contracts stay in this file.
 */

/** Token for the merged scope module configuration. */
export const SCOPE_CONFIG = Symbol.for("SCOPE_CONFIG");

/**
 * Token for the app-provided data source that bridges the client scope
 * service to your backend API (resolve a node → context, load the tree,
 * resolve a cascading value, persist the selection).
 */
export const SCOPE_DATA_SOURCE = Symbol.for("SCOPE_DATA_SOURCE");
