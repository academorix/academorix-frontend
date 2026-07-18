/**
 * @file index.ts
 * @module @stackra/i18n/testing
 * @description Public API for `@stackra/i18n/testing`.
 *
 *   Assertable mocks for every i18n contract seam, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mocks.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import {
 *   createMockI18nManager,
 *   createMockLocaleService,
 *   createMockLocaleStorage,
 * } from '@stackra/i18n/testing';
 *
 * const manager = createMockI18nManager({
 *   defaultLocale: 'en',
 *   translations: { en: { common: { hello: 'Hi' } } },
 * });
 * expect(manager.t('common.hello')).toBe('Hi');
 * expect(manager.$.wasCalledWith('translate', 'common.hello')).toBe(true);
 *
 * const locale = createMockLocaleService({ defaultLocale: 'en', supportedLocales: ['en', 'ar'] });
 * await locale.setLocale('ar');
 * expect(locale.getDir()).toBe('rtl');
 * ```
 */

export { MockI18nManager } from './mock-i18n-manager';
export { MockLocaleService } from './mock-locale-service';
export {
  MockDirectionAdapter,
  MockDirectionService,
  MockLocaleStorage,
  MockTranslationProvider,
  MockI18nLoader,
} from './mocks';
export {
  createMockI18nManager,
  createMockLocaleService,
  createMockDirectionService,
  createMockDirectionAdapter,
  createMockLocaleStorage,
  createMockTranslationProvider,
  createMockI18nLoader,
} from './create-mocks';
