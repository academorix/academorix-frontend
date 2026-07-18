/**
 * @file transformer.interface.ts
 * @module @stackra/support/interfaces
 * @description The generic transformer contract consumed by {@link TransformerChain}.
 *
 *   A transformer takes an input of type `T` and produces an output of
 *   the same type, using an optional context of type `C`. Transformers
 *   compose sequentially via `TransformerChain`.
 */

/**
 * Generic transformer contract.
 *
 * Transforms input data of type `T` using an optional context of type
 * `C`. Chains of transformers apply in priority order; each transformer
 * receives the output of the previous one.
 *
 * @typeParam T - The value type flowing through the chain.
 * @typeParam C - Optional context available to every transformer.
 */
export interface ITransformer<T, C = unknown> {
  /** Transform `input` using `context` and return the new value. */
  transform(input: T, context: C): T;
}
