/**
 * @file index.ts
 * @module @stackra/scope/testing
 * @description Public API for `@stackra/scope/testing`.
 *
 *   Assertable mock scope service + data source, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts.
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`.
 *   - `index.ts` — barrel re-exports.
 *
 *   Consumers register the mocks under the contract tokens
 *   (`SCOPE_SERVICE`, `SCOPE_DATA_SOURCE`) in their test container, or
 *   use them directly in a plain vitest suite without any DI wiring.
 *
 * @example
 * ```ts
 * import {
 *   createMockScopeService,
 *   createMockScopeDataSource,
 * } from '@stackra/scope/testing';
 *
 * const service = createMockScopeService({ scope: fixtureScope });
 * const source = createMockScopeDataSource({ scopes: { 'n-1': fixtureScope } });
 * ```
 */

export { MockScopeService } from './mock-scope-service';
export { MockScopeDataSource, type RecordedDataSourceCall } from './mock-scope-data-source';
export {
  createMockScopeService,
  createMockScopeDataSource,
  type CreateMockScopeServiceOptions,
  type CreateMockScopeDataSourceOptions,
} from './create-mock-scope';
