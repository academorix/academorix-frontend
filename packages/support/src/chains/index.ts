/**
 * @file index.ts
 * @module @stackra/support/chains
 * @description Public API barrel for priority-ordered chain classes.
 *
 *   - `ResolverChain` — first-non-`undefined` wins (fallback resolvers).
 *   - `TransformerChain` — every entry runs in order (data pipelines).
 */

export { ResolverChain } from "./resolver.chain";
export { TransformerChain } from "./transformer.chain";
