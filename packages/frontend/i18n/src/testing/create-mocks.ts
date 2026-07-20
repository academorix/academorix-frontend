/**
 * @file create-mocks.ts
 * @module @stackra/i18n/testing
 * @description Factories that wrap the mock services in
 *   `createAssertableProxy` — mirrors `@stackra/logger/testing`'s
 *   `createMockLogger` / `createMockLoggerManager` shape so consumers can
 *   write `mock.$.wasCalledWith('translate', ...)` assertions.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import { MockI18nManager } from "./mock-i18n-manager";
import { MockLocaleService } from "./mock-locale-service";
import {
  MockDirectionAdapter,
  MockDirectionService,
  MockLocaleStorage,
  MockTranslationProvider,
  MockI18nLoader,
} from "./mocks";
import type { I18nTranslation } from "@stackra/contracts";

// ── Managers / services ──────────────────────────────────────────────────

/**
 * Create an assertable `MockI18nManager`.
 *
 * @example
 * ```ts
 * const manager = createMockI18nManager({ defaultLocale: 'en' });
 * manager.t('common.hello', { args: { name: 'World' } });
 * expect(manager.$.wasCalledWith('translate', 'common.hello')).toBe(true);
 * ```
 */
export function createMockI18nManager<K = Record<string, unknown>>(options?: {
  defaultLocale?: string;
  supportedLocales?: string[];
  translations?: Record<string, I18nTranslation>;
}): AssertableProxy<MockI18nManager<K>> {
  return createAssertableProxy(new MockI18nManager<K>(options));
}

/**
 * Create an assertable `MockLocaleService`.
 */
export function createMockLocaleService(options?: {
  defaultLocale?: string;
  supportedLocales?: string[];
}): AssertableProxy<MockLocaleService> {
  return createAssertableProxy(new MockLocaleService(options));
}

/**
 * Create an assertable `MockDirectionService`.
 */
export function createMockDirectionService(): AssertableProxy<MockDirectionService> {
  return createAssertableProxy(new MockDirectionService());
}

// ── Small seams ──────────────────────────────────────────────────────────

/**
 * Create an assertable `MockDirectionAdapter`.
 */
export function createMockDirectionAdapter(): AssertableProxy<MockDirectionAdapter> {
  return createAssertableProxy(new MockDirectionAdapter());
}

/**
 * Create an assertable `MockLocaleStorage`.
 */
export function createMockLocaleStorage(seed?: string | null): AssertableProxy<MockLocaleStorage> {
  return createAssertableProxy(new MockLocaleStorage(seed));
}

/**
 * Create an assertable `MockTranslationProvider`.
 */
export function createMockTranslationProvider(): AssertableProxy<MockTranslationProvider> {
  return createAssertableProxy(new MockTranslationProvider());
}

/**
 * Create an assertable `MockI18nLoader`.
 */
export function createMockI18nLoader(
  translations: Record<string, I18nTranslation>,
): AssertableProxy<MockI18nLoader> {
  return createAssertableProxy(new MockI18nLoader(translations));
}
