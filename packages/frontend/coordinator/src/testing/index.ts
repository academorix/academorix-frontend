/**
 * @file index.ts
 * @module @stackra/coordinator/testing
 * @description Public API for `@stackra/coordinator/testing`.
 *
 *   Assertable mock tab coordinator + lock manager + tab transport
 *   manager, following the standard testing pattern used across the
 *   Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import {
 *   createMockCoordinator,
 *   createMockLockManager,
 *   createMockTabTransportManager,
 * } from '@stackra/coordinator/testing';
 *
 * const coordinator = createMockCoordinator();
 * const locks = createMockLockManager();
 * const manager = createMockTabTransportManager();
 *
 * coordinator.simulateRole('follower');
 * await locks.run('sync', async () => { ... });
 * manager.channel('room:42').subscribe((msg) => { ... });
 * ```
 */

export { MockTabCoordinator } from "./mock-tab-coordinator";
export { MockLockManager } from "./mock-lock-manager";
export { MockTabTransport, MockTabTransportManager } from "./mock-tab-transport-manager";
export { createMockCoordinator, createMockLockManager } from "./create-mock-coordinator";
export { createMockTabTransportManager } from "./create-mock-tab-transport-manager";
