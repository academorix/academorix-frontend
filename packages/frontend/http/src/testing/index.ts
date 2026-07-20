/**
 * @file index.ts
 * @module @stackra/http/testing
 * @description Public API for `@stackra/http/testing`.
 *
 *   Assertable mock HTTP manager + client, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockHttp } from '@stackra/http/testing';
 *
 * const http = createMockHttp();
 * const api = http.client();
 * api.stubResponse('GET', '/users/42', { data: { id: 42 } });
 *
 * const res = await api.get('/users/42');
 * expect(res.data).toEqual({ id: 42 });
 * api.$.assertCalled('get').with('/users/42').once();
 * ```
 */

export { MockHttpManager } from './mock-http-manager';
export { MockHttpClient, type RecordedRequest, type ResponseStub } from './mock-http-client';
export { createMockHttp, createMockHttpClient } from './create-mock-http';
