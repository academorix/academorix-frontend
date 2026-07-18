/**
 * @file create-mock-consent.ts
 * @module @stackra/consent/testing
 * @description Factories returning assertable mock consent instances.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';
import { MockConsentManager } from './mock-consent-manager';
import { MockConsentStorageAdapter } from './mock-consent-storage-adapter';

/** Options accepted by {@link createMockConsentManager}. */
export interface CreateMockConsentManagerOptions {
  /** Seed preferences (category slug → granted). */
  preferences?: Record<string, boolean>;
  /** Slugs that are always granted (cannot be revoked). */
  required?: readonly string[];
  /** Seed `isDecided()`. */
  decided?: boolean;
}

/**
 * Create an assertable mock consent manager.
 *
 * The returned instance implements the full `IConsentManager` contract
 * and records every method call for assertion via `mock.$.wasCalled()` /
 * `mock.$.wasCalledWith()` / `mock.$.callCount()`.
 *
 * @example
 * ```ts
 * const consent = createMockConsentManager({
 *   preferences: { analytics: false },
 *   required: ['necessary'],
 * });
 * consent.grantConsent('analytics');
 * expect(consent.hasConsent('analytics')).toBe(true);
 * expect(consent.$.wasCalledWith('grantConsent', 'analytics')).toBe(true);
 * ```
 */
export function createMockConsentManager(
  options: CreateMockConsentManagerOptions = {}
): AssertableProxy<MockConsentManager> {
  return createAssertableProxy(new MockConsentManager(options));
}

/**
 * Create an assertable mock consent storage adapter.
 *
 * Seeded with an optional initial preferences map. Records every
 * `load` / `save` / `clear` invocation on both the proxy bookkeeper
 * and the mock's `.calls` array.
 */
export function createMockConsentStorageAdapter(
  seed?: Record<string, boolean> | null
): AssertableProxy<MockConsentStorageAdapter> {
  return createAssertableProxy(new MockConsentStorageAdapter(seed));
}
