/**
 * @file create-mock-csp.ts
 * @module @stackra/csp/testing
 * @description Factories returning assertable mock CSP instances.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';
import { MockCspService, type MockCspServiceOptions } from './mock-csp-service';
import { MockNonceGenerator, type MockNonceGeneratorOptions } from './mock-nonce-generator';

/**
 * Create an assertable mock CSP service.
 *
 * @example
 * ```ts
 * const csp = createMockCspService();
 * const policy = csp.generatePolicy();
 * expect(policy.nonce).toBe('test-nonce-1');
 * expect(csp.$.wasCalled('generatePolicy')).toBe(true);
 * ```
 */
export function createMockCspService(
  options: MockCspServiceOptions = {}
): AssertableProxy<MockCspService> {
  return createAssertableProxy(new MockCspService(options));
}

/**
 * Create an assertable mock nonce generator.
 *
 * @example
 * ```ts
 * const gen = createMockNonceGenerator();
 * expect(gen.generate()).toBe('test-nonce-1');
 * ```
 */
export function createMockNonceGenerator(
  options: MockNonceGeneratorOptions = {}
): AssertableProxy<MockNonceGenerator> {
  return createAssertableProxy(new MockNonceGenerator(options));
}

/**
 * Alias for {@link createMockNonceGenerator} that reads as a
 * React-provider factory — useful in tests wiring `<NonceProvider>`.
 *
 * Returns the assertable generator plus a `nonce` field snapshotted at
 * call time so consumers can pass a stable nonce into the provider.
 */
export function createMockNonceProvider(
  options: MockNonceGeneratorOptions = {}
): AssertableProxy<MockNonceGenerator> & { readonly nonce: string } {
  const generator = createMockNonceGenerator(options);
  const nonce = generator.generate();
  return Object.assign(generator, { nonce });
}
