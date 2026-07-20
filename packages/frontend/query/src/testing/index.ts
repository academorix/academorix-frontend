/**
 * @file index.ts
 * @module @stackra/query/testing
 * @description Public API for `@stackra/query/testing`.
 *
 *   Assertable mock query client (`IQueryClient`), following the
 *   standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementation of the interface contract.
 *   - `create-mock-*.ts` — factory wrapping the mock in `createAssertableProxy`.
 *   - `index.ts` — barrel re-exports.
 *
 *   Consumers register the mock under `QUERY_CLIENT` in their test
 *   container, or hand it directly to a `QueryHandler` / `RefreshHandler`
 *   under test.
 *
 * @example
 * ```ts
 * import { createMockQueryClient } from '@stackra/query/testing';
 *
 * const client = createMockQueryClient();
 * const off = client.registerFetcher(['users', 1], async () => ({ id: 1 }));
 * await client.invalidate(['users', 1]);
 * expect(client.$.wasCalledWith('invalidate', ['users', 1])).toBe(true);
 * off();
 * ```
 */

export { MockQueryClient, type RecordedQueryCall } from "./mock-query-client";
export { createMockQueryClient } from "./create-mock-query";
