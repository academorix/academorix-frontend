/**
 * @file create-mock-pipeline.ts
 * @module @stackra/pipeline/testing
 * @description Factory returning an assertable `Pipeline` instance.
 *
 *   Wraps a real `Pipeline` (not a fake) in `createAssertableProxy` so
 *   the fluent chain still works while every method call is recorded.
 *   Useful when a consumer accepts a `Pipeline` and you want to assert
 *   that `.send()`, `.through()`, and `.then()` were invoked with the
 *   expected arguments.
 */

import type { IApplication } from "@stackra/contracts";
import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { Pipeline } from "../services";

/**
 * Create an assertable `Pipeline`.
 *
 * The returned proxy behaves identically to `new Pipeline(container)`
 * — chain `.send().through().then()` exactly like production code.
 *
 * @example
 * ```ts
 * const pipeline = createMockPipeline<Request, Response>();
 * const result = pipeline
 *   .send(request)
 *   .through([authMiddleware])
 *   .then((req) => handle(req));
 *
 * expect(pipeline.$.wasCalledWith('through', [authMiddleware])).toBe(true);
 * ```
 */
export function createMockPipeline<TPassable = unknown, TReturn = TPassable>(
  container?: IApplication,
): AssertableProxy<Pipeline<TPassable, TReturn>> {
  return createAssertableProxy(new Pipeline<TPassable, TReturn>(container));
}
