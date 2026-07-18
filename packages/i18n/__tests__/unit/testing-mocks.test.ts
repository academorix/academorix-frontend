/**
 * @file testing-mocks.test.ts
 * @description Smoke tests for `@stackra/i18n/testing` — verifies each
 *   mock respects its contract and the assertable proxy records calls.
 */

import { describe, it, expect } from 'vitest';
import {
  MockI18nManager,
  MockLocaleService,
  MockLocaleStorage,
  MockDirectionAdapter,
  MockDirectionService,
  MockTranslationProvider,
  MockI18nLoader,
  createMockI18nManager,
  createMockLocaleService,
  createMockLocaleStorage,
  createMockDirectionAdapter,
} from '@/testing';

describe('@stackra/i18n/testing', () => {
  describe('MockI18nManager', () => {
    it('translates from seeded translations', () => {
      const manager = new MockI18nManager({
        defaultLocale: 'en',
        translations: { en: { common: { hello: 'Hi' } } },
      });
      expect(manager.t('common.hello')).toBe('Hi');
    });

    it('records every translate call', () => {
      const manager = new MockI18nManager();
      manager.t('a.b');
      manager.t('c.d', { lang: 'ar' });
      expect(manager.calls).toEqual([
        { key: 'a.b', lang: 'en', options: undefined },
        { key: 'c.d', lang: 'ar', options: { lang: 'ar' } },
      ]);
    });

    it('falls back to key when translation missing', () => {
      const manager = new MockI18nManager();
      expect(manager.t('missing.key')).toBe('missing.key');
    });

    it('mergeTranslations adds a namespace', () => {
      const manager = new MockI18nManager({
        translations: { en: {} },
      });
      manager.mergeTranslations('checkout', { en: { title: 'Checkout' } });
      expect(manager.t('checkout.title')).toBe('Checkout');
    });
  });

  describe('MockLocaleService', () => {
    it('starts with the default locale', () => {
      const service = new MockLocaleService({ defaultLocale: 'en' });
      expect(service.getLocale()).toBe('en');
    });

    it('flips direction for RTL locales', async () => {
      const service = new MockLocaleService({ supportedLocales: ['en', 'ar'] });
      await service.setLocale('ar');
      expect(service.getDir()).toBe('rtl');
      expect(service.isRTL()).toBe(true);
    });

    it('rejects unsupported locales', async () => {
      const service = new MockLocaleService({ supportedLocales: ['en'] });
      await expect(service.setLocale('de')).rejects.toThrow('not supported');
    });

    it('notifies subscribers', async () => {
      const service = new MockLocaleService({ supportedLocales: ['en', 'ar'] });
      const seen: string[] = [];
      service.subscribe((l) => seen.push(l));
      await service.setLocale('ar');
      expect(seen).toEqual(['ar']);
    });
  });

  describe('MockLocaleStorage', () => {
    it('round-trips a persisted locale', async () => {
      const storage = new MockLocaleStorage();
      await storage.setLocale('fr');
      expect(await storage.getLocale()).toBe('fr');
      await storage.clearLocale();
      expect(await storage.getLocale()).toBeNull();
    });

    it('records ops', async () => {
      const storage = new MockLocaleStorage('en');
      await storage.getLocale();
      await storage.setLocale('ar');
      expect(storage.calls).toEqual([{ op: 'get' }, { op: 'set', value: 'ar' }]);
    });
  });

  describe('MockDirectionAdapter', () => {
    it('applies and reports the current direction', () => {
      const adapter = new MockDirectionAdapter();
      adapter.apply('rtl', 'ar');
      expect(adapter.getCurrentDirection()).toBe('rtl');
      expect(adapter.calls).toEqual([{ direction: 'rtl', locale: 'ar' }]);
    });
  });

  describe('MockDirectionService', () => {
    it('detects RTL from base language', () => {
      const svc = new MockDirectionService();
      expect(svc.isRtl('ar-SA')).toBe(true);
      expect(svc.isRtl('en-US')).toBe(false);
    });
  });

  describe('MockTranslationProvider', () => {
    it('echoes text back and records calls', async () => {
      const provider = new MockTranslationProvider();
      const out = await provider.translate('greet', 'hello', 'en', 'ar');
      expect(out).toBe('hello');
      expect(provider.calls).toEqual([{ key: 'greet', text: 'hello', from: 'en', to: 'ar' }]);
    });
  });

  describe('MockI18nLoader', () => {
    it('serves from the seeded map', async () => {
      const loader = new MockI18nLoader({ en: { common: { hi: 'hi' } } });
      expect(await loader.load('en')).toEqual({ common: { hi: 'hi' } });
      expect(await loader.languages()).toEqual(['en']);
    });
  });

  describe('assertable factories', () => {
    it('createMockI18nManager wraps in an assertable proxy', () => {
      const manager = createMockI18nManager({
        translations: { en: { hi: 'hi' } },
      });
      manager.t('hi' as never);
      // The proxy records the outer method call — `t` is what the caller
      // invoked; the internal delegation to `translate` is an impl detail.
      expect(manager.$.wasCalledWith('t', 'hi')).toBe(true);
    });

    it('createMockLocaleService is assertable', async () => {
      const service = createMockLocaleService({ supportedLocales: ['en', 'ar'] });
      await service.setLocale('ar');
      expect(service.$.wasCalledWith('setLocale', 'ar')).toBe(true);
    });

    it('createMockLocaleStorage is assertable', async () => {
      const storage = createMockLocaleStorage();
      await storage.setLocale('en');
      expect(storage.$.wasCalledWith('setLocale', 'en')).toBe(true);
    });

    it('createMockDirectionAdapter is assertable', () => {
      const adapter = createMockDirectionAdapter();
      adapter.apply('rtl', 'ar');
      expect(adapter.$.wasCalledWith('apply', 'rtl', 'ar')).toBe(true);
    });
  });
});
