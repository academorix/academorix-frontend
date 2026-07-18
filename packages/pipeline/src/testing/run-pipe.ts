/**
 * @file run-pipe.ts
 * @module @stackra/pipeline/testing
 * @description Standalone helper that runs a single pipe against a passable.
 *
 *   Consumers prefer this over spinning up a full `Pipeline` when they
 *   want to exercise one pipe in isolation — for example, testing that a
 *   middleware short-circuits on invalid input.
 */

import type { PipeType, PipeTuple } from "../interfaces";

type NextFn<T> = (passable: T) => unknown;

/**
 * Run a pipe against a passable and a `next` callback.
 *
 * Handles every supported pipe form:
 * - Function: `(passable, next) => result`
 * - Object: instance with a `handle(passable, next)` method (or the
 *   custom method name passed in `options.method`)
 * - Tuple: `[pipeEntry, ...params]` — extra params appended after `next`
 *
 * String pipes require a container to resolve them and are therefore
 * not supported by this helper. Use `Pipeline.send().through([...]).then(...)`
 * with a container when you need string-token resolution.
 *
 * @example
 * ```ts
 * const result = await runPipe(
 *   (value: number, next) => next(value + 1),
 *   1,
 *   (v) => v * 2
 * );
 * expect(result).toBe(4);
 * ```
 */
export function runPipe<TPassable, TReturn = unknown>(
  pipe: PipeType,
  passable: TPassable,
  next?: NextFn<TPassable>,
  options: { method?: string } = {},
): TReturn {
  const effectiveNext: NextFn<TPassable> = next ?? ((value) => value as unknown);
  const method = options.method ?? "handle";

  // Tuple form: [pipeEntry, ...params]
  if (Array.isArray(pipe)) {
    const [entry, ...params] = pipe as PipeTuple;

    if (typeof entry === "function") {
      return (entry as (p: TPassable, n: NextFn<TPassable>, ...rest: unknown[]) => TReturn)(
        passable,
        effectiveNext,
        ...params,
      );
    }

    if (typeof entry === "object" && entry !== null) {
      const handler = (entry as Record<string, unknown>)[method];
      if (typeof handler !== "function") {
        throw new Error(`runPipe: object pipe has no "${method}" method.`);
      }
      return (handler as (...args: unknown[]) => TReturn).call(
        entry,
        passable,
        effectiveNext,
        ...params,
      );
    }

    throw new Error(`runPipe: unsupported tuple entry (${typeof entry}).`);
  }

  // Function form
  if (typeof pipe === "function") {
    return (pipe as (p: TPassable, n: NextFn<TPassable>) => TReturn)(passable, effectiveNext);
  }

  // Object form
  if (typeof pipe === "object" && pipe !== null) {
    const handler = (pipe as Record<string, unknown>)[method];
    if (typeof handler !== "function") {
      throw new Error(`runPipe: object pipe has no "${method}" method.`);
    }
    return (handler as (...args: unknown[]) => TReturn).call(pipe, passable, effectiveNext);
  }

  throw new Error(
    `runPipe: unsupported pipe form (${typeof pipe}). ` +
      "String pipes require a container — use Pipeline directly.",
  );
}
