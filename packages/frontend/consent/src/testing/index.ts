/**
 * @file index.ts
 * @module @stackra/consent/testing
 * @description Public API for `@stackra/consent/testing`.
 *
 *   Assertable mock consent manager + storage adapter, following the
 *   standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts.
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`.
 *   - `index.ts` — barrel re-exports.
 *
 *   Consumers register the mocks under the contract tokens
 *   (`CONSENT_MANAGER`, `CONSENT_STORAGE_ADAPTER`) in their test container,
 *   or use them directly in a plain vitest suite without any DI wiring.
 *
 * @example
 * ```ts
 * import { createMockConsentManager } from '@stackra/consent/testing';
 *
 * const consent = createMockConsentManager({ required: ['necessary'] });
 * consent.grantConsent('analytics');
 * expect(consent.hasConsent('analytics')).toBe(true);
 * expect(consent.$.wasCalledWith('grantConsent', 'analytics')).toBe(true);
 * ```
 */

export { MockConsentManager } from './mock-consent-manager';
export {
  MockConsentStorageAdapter,
  type RecordedStorageCall,
} from './mock-consent-storage-adapter';
export {
  createMockConsentManager,
  createMockConsentStorageAdapter,
  type CreateMockConsentManagerOptions,
} from './create-mock-consent';
