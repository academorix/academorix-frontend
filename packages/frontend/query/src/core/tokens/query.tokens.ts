/**
 * @file query.tokens.ts
 * @module @stackra/query/core/tokens
 * @description Package-local DI token for the query layer.
 *
 *   `QUERY_CONFIG` is internal to `@stackra/query` (only `QueryModule`
 *   provides it and only the query hooks read it), so it lives in the
 *   package rather than in `@stackra/contracts`.
 */

/** Token for the query-layer default configuration provided by `QueryModule`. */
export const QUERY_CONFIG = Symbol.for("STACKRA_QUERY_CONFIG");
