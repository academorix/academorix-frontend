/**
 * @file create-mock-http.ts
 * @module @stackra/http/testing
 * @description Factories returning assertable HTTP mocks.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';
import { MockHttpClient } from './mock-http-client';
import { MockHttpManager } from './mock-http-manager';

/**
 * Create an assertable mock HTTP manager.
 *
 * @example
 * ```ts
 * const http = createMockHttp();
 * const api = http.client(); // synchronous MockHttpClient
 * api.stubResponse('GET', '/users/42', { data: { id: 42, name: 'Ada' } });
 *
 * await userService.load(42); // internally: api.get('/users/42')
 *
 * expect(http.$.wasCalled('connection')).toBe(true);
 * expect(api.requestsFor('GET')).toHaveLength(1);
 * ```
 */
export function createMockHttp(): AssertableProxy<MockHttpManager> {
  return createAssertableProxy(new MockHttpManager());
}

/**
 * Create an assertable mock HTTP client — for tests that inject an
 * `IHttpClient` directly (via `@InjectHttp()`) without a manager.
 *
 * @example
 * ```ts
 * const client = createMockHttpClient();
 * client.stubResponse('POST', '/orders', { status: 201, data: { id: 'o1' } });
 * await service.placeOrder(client);
 * client.$.assertCalled('post').with('/orders').once();
 * ```
 */
export function createMockHttpClient(): AssertableProxy<MockHttpClient> {
  return createAssertableProxy(new MockHttpClient());
}
