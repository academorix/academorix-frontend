/**
 * @file create-mock-logger.ts
 * @module @stackra/logger/testing
 * @description Factories returning assertable logger mocks.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockLogger } from "./mock-logger";
import { MockLoggerManager } from "./mock-logger-manager";

/**
 * Create an assertable mock logger.
 *
 * @example
 * ```ts
 * const logger = createMockLogger();
 * logger.info('user created', { id: '42' });
 * expect(logger.$.wasCalledWith('info', 'user created', { id: '42' })).toBe(true);
 * expect(logger.getLogsByLevel('info')).toHaveLength(1);
 * ```
 */
export function createMockLogger(): AssertableProxy<MockLogger> {
  return createAssertableProxy(new MockLogger());
}

/**
 * Create an assertable mock logger manager.
 *
 * @example
 * ```ts
 * const manager = createMockLoggerManager();
 * const scoped = manager.create('UserService');
 * scoped.info('user created');
 * expect(manager.getLogger('UserService')?.logs).toHaveLength(1);
 * expect(manager.$.wasCalledWith('create', 'UserService')).toBe(true);
 * ```
 */
export function createMockLoggerManager(): AssertableProxy<MockLoggerManager> {
  return createAssertableProxy(new MockLoggerManager());
}
