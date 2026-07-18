/**
 * @file index.ts
 * @module @stackra/routing/matchers
 * @description Public API for the `@stackra/routing/matchers` subpath.
 *
 *   Exports the four callable builders (`subdomain`, `query`,
 *   `header`, `hash`). Predicate types live in `@stackra/contracts` —
 *   consumers import them from there directly (per contract-reexports
 *   rule).
 */

export { subdomain, query, header, hash } from "./builders";
