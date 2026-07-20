/**
 * @file pipeline.ts
 * @module @stackra/support
 * @description Middleware pipeline implementing the chain-of-responsibility pattern.
 *   Passes a value through a series of pipe functions, each able to transform
 *   the value or short-circuit the pipeline. Inspired by Laravel's Pipeline.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/** A pipe function that receives a value and a next callback. */
export type PipeFunction<T> = (value: T, next: (value: T) => T) => T;

// ════════════════════════════════════════════════════════════════════════════════
// Pipeline Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Middleware pipeline — passes a value through an ordered series of pipes.
 *
 * Implements the chain-of-responsibility pattern. Each pipe receives the
 * current value and a `next` function. Calling `next(value)` passes control
 * to the next pipe; returning directly short-circuits the chain.
 *
 * Usage follows the fluent builder pattern: `send → through → then`.
 *
 * @typeParam T - The type of the passable value
 *
 * @example
 * ```typescript
 * import { Pipeline } from '@stackra/support';
 *
 * const result = new Pipeline<string>()
 *   .send('hello')
 *   .through([
 *     (value, next) => next(value.toUpperCase()),
 *     (value, next) => next(value + '!'),
 *     (value, next) => next(value + ' WORLD'),
 *   ])
 *   .then((value) => value.trim());
 *
 * // result === 'HELLO! WORLD'
 * ```
 */
export class Pipeline<T> {
  /** The object being passed through the pipeline. */
  private passable!: T;

  /** The array of pipe functions to execute in order. */
  private pipes: PipeFunction<T>[] = [];

  // ══════════════════════════════════════════════════════════════════════════
  // Fluent API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Set the value to be sent through the pipeline.
   *
   * @param passable - The value to pass through pipes
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * pipeline.send(request);
   * ```
   */
  public send(passable: T): this {
    this.passable = passable;
    return this;
  }

  /**
   * Set the array of pipe functions to process.
   *
   * @param pipes - Array of pipe functions
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * pipeline.through([trimPipe, validatePipe, transformPipe]);
   * ```
   */
  public through(pipes: PipeFunction<T>[]): this {
    this.pipes = pipes;
    return this;
  }

  /**
   * Execute the pipeline and return the final result.
   *
   * Runs the passable through all pipes in order, then passes the result
   * to the destination function. The destination is the final handler
   * that receives the fully-processed value.
   *
   * @param destination - The final handler that receives the processed value
   * @returns The result of the destination function
   *
   * @example
   * ```typescript
   * const result = pipeline
   *   .send(rawInput)
   *   .through([normalize, validate, sanitize])
   *   .then((input) => saveToDatabase(input));
   * ```
   */
  public then(destination: (value: T) => T): T {
    const pipeline = this.buildPipeline(destination);
    return pipeline(this.passable);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Internal
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Build the nested pipeline function by composing pipes right-to-left.
   *
   * Each pipe wraps the next one, creating a chain where each pipe's `next`
   * parameter is the subsequent pipe in the sequence.
   *
   * @param destination - The terminal function at the end of the chain
   * @returns A single function that runs the entire pipeline
   */
  private buildPipeline(destination: (value: T) => T): (value: T) => T {
    // Start from the end (destination) and wrap backwards
    return this.pipes.reduceRight<(value: T) => T>((next, pipe) => {
      return (value: T): T => pipe(value, next);
    }, destination);
  }
}
