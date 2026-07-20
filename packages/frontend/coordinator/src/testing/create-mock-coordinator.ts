/**
 * @file create-mock-coordinator.ts
 * @module @stackra/coordinator/testing
 * @description Factories returning assertable coordinator mocks.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockTabCoordinator } from "./mock-tab-coordinator";
import { MockLockManager } from "./mock-lock-manager";

/**
 * Create an assertable mock tab coordinator.
 *
 * The mock starts as leader — flip roles with `.simulateRole()` to test
 * both branches of consumer code.
 *
 * @example
 * ```ts
 * const coordinator = createMockCoordinator();
 * expect(coordinator.isLeader()).toBe(true);
 * coordinator.simulateRole('follower');
 * expect(coordinator.$.wasCalled('simulateRole')).toBe(true);
 * ```
 */
export function createMockCoordinator(): AssertableProxy<MockTabCoordinator> {
  return createAssertableProxy(new MockTabCoordinator());
}

/**
 * Create an assertable mock lock manager.
 *
 * @example
 * ```ts
 * const locks = createMockLockManager();
 * const result = await locks.run('token-refresh', async () => 42);
 * expect(result).toBe(42);
 * expect(locks.$.wasCalledWith('run', 'token-refresh')).toBe(true);
 * ```
 */
export function createMockLockManager(): AssertableProxy<MockLockManager> {
  return createAssertableProxy(new MockLockManager());
}
