/**
 * @file index.ts
 * @module @stackra/network/testing
 * @description Public API for `@stackra/network/testing`.
 *
 *   Assertable mock network service following the standard testing pattern
 *   used across the Stackra monorepo.
 *
 * @example
 * ```ts
 * import { createMockNetwork } from '@stackra/network/testing';
 *
 * const network = createMockNetwork();
 * network.goOffline();
 * expect(network.isOnline()).toBe(false);
 * ```
 */

export { MockNetworkService } from "./mock-network-service";
export { createMockNetwork } from "./create-mock-network";
