/**
 * @file index.ts
 * @module @stackra/csp/testing
 * @description Public API for `@stackra/csp/testing`.
 *
 *   Assertable mock CSP service + nonce generator, following the
 *   standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts.
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`.
 *   - `index.ts` — barrel re-exports.
 *
 *   Consumers register the mocks under the contract tokens
 *   (`CSP_SERVICE`) in their test container, or use them directly in a
 *   plain vitest suite without any DI wiring. Nonces are deterministic
 *   (`'test-nonce-1'`, `'test-nonce-2'`, …) so header snapshots stay
 *   stable across runs.
 *
 * @example
 * ```ts
 * import { createMockCspService, createMockNonceProvider } from '@stackra/csp/testing';
 *
 * const csp = createMockCspService();
 * const { nonce } = csp.generatePolicy();
 * expect(nonce).toBe('test-nonce-1');
 * expect(csp.$.wasCalled('generatePolicy')).toBe(true);
 *
 * const nonceProvider = createMockNonceProvider();
 * render(<NonceProvider nonce={nonceProvider.nonce}>{children}</NonceProvider>);
 * ```
 */

export {
  MockCspService,
  type MockCspServiceOptions,
  type RecordedCspCall,
} from './mock-csp-service';
export { MockNonceGenerator, type MockNonceGeneratorOptions } from './mock-nonce-generator';
export {
  createMockCspService,
  createMockNonceGenerator,
  createMockNonceProvider,
} from './create-mock-csp';
