/**
 * @file index.ts
 * @module @stackra/pipeline/testing
 * @description Public API for `@stackra/pipeline/testing`.
 *
 *   Two helpers for exercising middleware in isolation:
 *   - `runPipe()` — invoke a single pipe against a passable + next
 *   - `createMockPipeline()` — assertable wrapper around a real `Pipeline`
 *
 *   Follows the standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` / helpers — in-memory implementations
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { runPipe, createMockPipeline } from '@stackra/pipeline/testing';
 *
 * // Single-pipe test
 * const result = runPipe(
 *   (v: number, next) => next(v * 2),
 *   3,
 *   (v) => v + 1
 * );
 * expect(result).toBe(7);
 *
 * // Assertable pipeline
 * const pipeline = createMockPipeline<Request, Response>();
 * pipeline.send(req).through([mw]).then(handler);
 * expect(pipeline.$.wasCalled('through')).toBe(true);
 * ```
 */

export { runPipe } from "./run-pipe";
export { createMockPipeline } from "./create-mock-pipeline";
