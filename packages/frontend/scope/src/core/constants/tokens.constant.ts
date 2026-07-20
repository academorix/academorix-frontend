/**
 * @file tokens.constant.ts
 * @module @stackra/scope/core/constants
 * @description DI tokens for the client scope runtime.
 */

/** Token for the client `ScopeService` (current scope + tree + emulation). */
export const SCOPE_SERVICE = Symbol.for("SCOPE_SERVICE");

/** Token for the merged scope module configuration. */
export const SCOPE_CONFIG = Symbol.for("SCOPE_CONFIG");

/**
 * Token for the app-provided data source that bridges the client scope
 * service to your backend API (resolve a node → context, load the tree,
 * resolve a cascading value, persist the selection).
 */
export const SCOPE_DATA_SOURCE = Symbol.for("SCOPE_DATA_SOURCE");
