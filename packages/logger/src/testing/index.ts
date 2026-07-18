/**
 * @file index.ts
 * @module @stackra/logger/testing
 * @description Public API for `@stackra/logger/testing`.
 *
 *   Assertable mock logger + logger manager, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockLogger, createMockLoggerManager } from '@stackra/logger/testing';
 *
 * // Standalone logger
 * const logger = createMockLogger();
 * logger.info('hello', { id: '42' });
 * expect(logger.$.wasCalledWith('info', 'hello', { id: '42' })).toBe(true);
 *
 * // Full manager
 * const manager = createMockLoggerManager();
 * const scoped = manager.create('UserService');
 * scoped.error('boom');
 * expect(manager.getLogger('UserService')?.getLogsByLevel('error')).toHaveLength(1);
 * ```
 */

export { MockLogger, type RecordedLog } from "./mock-logger";
export { MockLoggerManager } from "./mock-logger-manager";
export { createMockLogger, createMockLoggerManager } from "./create-mock-logger";
