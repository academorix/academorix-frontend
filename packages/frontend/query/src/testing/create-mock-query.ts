/**
 * @file create-mock-query.ts
 * @module @stackra/query/testing
 * @description Factory returning an assertable mock query client.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockQueryClient } from "./mock-query-client";

/**
 * Create an assertable mock query client.
 *
 * Returns a proxy over an in-memory client that implements the full
 * `IQueryClient` contract and records every method call for assertion
 * via `mock.$.wasCalled()` / `mock.$.wasCalledWith()`.
 *
 * @example
 * ```ts
 * const client = createMockQueryClient();
 * const off = client.registerFetcher(['users', 1], async () => ({ id: 1 }));
 * await client.invalidate(['users', 1]);
 * expect(client.$.wasCalledWith('invalidate', ['users', 1])).toBe(true);
 * expect(client.getInvalidations(['users', 1])).toBe(1);
 * off();
 * ```
 */
export function createMockQueryClient(): AssertableProxy<MockQueryClient> {
  return createAssertableProxy(new MockQueryClient());
}
