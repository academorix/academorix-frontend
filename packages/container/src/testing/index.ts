/**
 * @file index.ts
 * @module @stackra/container/testing
 * @description Public API for `@stackra/container/testing`.
 *
 *   Assertable mock application context (`IApplication`) for unit tests
 *   that inject `APPLICATION` or interact with the DI container.
 *   Follows the standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockApplication } from '@stackra/container/testing';
 * import { LOGGER } from '@stackra/logger';
 * import { createMockLogger } from '@stackra/logger/testing';
 *
 * const logger = createMockLogger();
 * const app = createMockApplication([[LOGGER, logger]]);
 * expect(app.get(LOGGER)).toBe(logger);
 * ```
 */

export { MockApplication, type IMockApplication } from "./mock-application";
export { createMockApplication } from "./create-mock-application";
