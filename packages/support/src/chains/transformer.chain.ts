/**
 * @file transformer-chain.ts
 * @module @stackra/support
 * @description Ordered chain of transformers executed sequentially by priority.
 *
 *   Used by the navigation system's menu transformer pipeline and other
 *   packages needing priority-ordered data transformation. Each
 *   transformer receives the output of the previous one.
 */

import type { ITransformer } from "../interfaces";

// ============================================================================
// Chain
// ============================================================================

/** Internal entry with priority. */
interface IChainEntry<T, C> {
  /** The transformer instance. */
  transformer: ITransformer<T, C>;
  /** Priority for ordering (lower runs first). */
  priority: number;
}

/**
 * Ordered chain of transformers executed sequentially.
 *
 * @example
 * ```typescript
 * import { TransformerChain } from '@stackra/support';
 *
 * const chain = new TransformerChain<string[], TransformContext>();
 * chain.register(myTransformer, 10);
 * const result = chain.run(items, context);
 * ```
 *
 * @typeParam T - The value type flowing through the chain.
 * @typeParam C - Optional context available to every transformer.
 */
export class TransformerChain<T, C = unknown> {
  /** Internal list of entries, kept sorted lazily via `dirty`. */
  private entries: IChainEntry<T, C>[] = [];

  /** Whether the chain needs re-sorting before the next run. */
  private dirty = false;

  /**
   * Register a transformer with a priority.
   *
   * @param transformer - The transformer to register.
   * @param priority - Priority (lower runs first). Defaults to `50`.
   */
  public register(transformer: ITransformer<T, C>, priority = 50): void {
    this.entries.push({ transformer, priority });
    // Sorting is deferred until the next `run` / `getOrdered` — cheap
    // registration, one-shot sort on read.
    this.dirty = true;
  }

  /**
   * Execute every transformer in priority order.
   *
   * @param input - The initial input to transform.
   * @param context - The context passed to each transformer.
   * @returns The final transformed output.
   */
  public run(input: T, context: C): T {
    if (this.dirty) {
      this.entries.sort((a, b) => a.priority - b.priority);
      this.dirty = false;
    }

    let result = input;
    for (const entry of this.entries) {
      result = entry.transformer.transform(result, context);
    }
    return result;
  }

  /**
   * Return every registered transformer in priority order.
   *
   * @returns Ordered array of transformer instances.
   */
  public getOrdered(): ITransformer<T, C>[] {
    if (this.dirty) {
      this.entries.sort((a, b) => a.priority - b.priority);
      this.dirty = false;
    }
    return this.entries.map((e) => e.transformer);
  }
}

// Re-export ITransformer from its canonical home so consumers who only
// import from this module can still reach the interface.
export type { ITransformer } from "../interfaces";
