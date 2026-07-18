/**
 * @file pipeline-options.interface.ts
 * @module @stackra/pipeline/interfaces
 * @description Internal pipeline configuration interfaces.
 *   Defines the types used for pipe resolution and pipeline definition callbacks.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Pipe Type Union
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Function pipe — a closure that receives the passable and a next callback.
 *
 * @typeParam TPassable - The type of value flowing through the pipeline
 * @typeParam TReturn - The return type of the pipeline
 */
export type PipeClosure<TPassable = unknown, TReturn = unknown> = (
  passable: TPassable,
  next: (passable: TPassable) => TReturn,
) => TReturn;

/**
 * Tuple pipe — a class reference (or string) paired with additional parameters.
 * Equivalent to Laravel's `'ClassName:param1,param2'` syntax.
 *
 * The first element is the pipe (class or string), and subsequent elements
 * are parameters passed to the pipe's handler method after `passable` and `next`.
 */
export type PipeTuple = [pipe: PipeEntry, ...params: unknown[]];

/**
 * A single pipe entry (without parameters).
 * Can be a closure, a string for container resolution, or an object instance.
 */
export type PipeEntry = PipeClosure | string | object;

/**
 * Union of all supported pipe types.
 *
 * - `PipeClosure` — function `(passable, next) => result`
 * - `string` — class name resolved from DI container
 * - `object` — pipe instance with a handler method (default: `handle`)
 * - `PipeTuple` — `[pipe, ...params]` for parameterized pipes
 */
export type PipeType = PipeClosure | string | object | PipeTuple;

// ════════════════════════════════════════════════════════════════════════════════
// Pipeline Definition (for Hub)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Pipeline definition callback used by the Hub.
 *
 * Receives a fresh Pipeline instance and the passable, configures the pipeline,
 * and returns the result.
 */
export type PipelineDefinition = (pipeline: unknown, passable: unknown) => unknown;
