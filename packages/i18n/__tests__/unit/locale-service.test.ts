/**
 * @file locale-service.test.ts
 * @description Unit tests for `I18nLocaleService` — validation, persistence,
 *   direction application, manager coordination via the `OnModuleInit`
 *   bridge, and hydration in `OnApplicationBootstrap`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IDirectionAdapter, ILocaleStorage } from '@stackra/contracts';

import { I18nLocaleService } from '@/core/services/i18n-locale.service';
import { I18nManager } from '@/core/services/i18n-manager.service';
import { DirectionService } from '@/core/services/direction.service';

describe('I18nLocaleService', () => {
  let service: I18nLocaleService;
  let manager: I18nManager;
  let directionService: DirectionService;
  let mockStorage: ILocaleStorage;
  let mockAdapter: IDirectionAdapter;

  beforeEach(() => {
    mockAdapter = {
      apply: vi.fn().mockReturnValue(false),
      getCurrentDirection: vi.fn().mockReturnValue('ltr'),
    };

    mockStorage = {
      getLocale: vi.fn().mockResolvedValue(null),
      setLocale: vi.fn().mockResolvedValue(undefined),
      clearLocale: vi.fn().mockResolvedValue(undefined),
    };

    directionService = new DirectionService(mockAdapter);
    manager = new I18nManager({
      defaultLocale: 'en',
      supportedLocales: ['en', 'ar', 'fr'],
    });

    service = new I18nLocaleService(
      { defaultLocale: 'en', supportedLocales: ['en', 'ar', 'fr'], persistLocale: true } as any,
      directionService,
      manager,
      mockStorage
    );

    // Post-wire step normally driven by the container lifecycle.
    service.onModuleInit();
  });

  it('starts with the default locale', () => {
    expect(service.getLocale()).toBe('en');
  });

  it('returns correct direction for default locale', () => {
    expect(service.getDir()).toBe('ltr');
    expect(service.isRTL()).toBe(false);
  });

  it('returns supported locales', () => {
    expect(service.getSupportedLocales()).toEqual(['en', 'ar', 'fr']);
  });

  it('exposes a stable snapshot for useSyncExternalStore', () => {
    expect(service.getSnapshot()).toBe('en');
  });

  describe('setLocale()', () => {
    it('switches to a supported locale', async () => {
      await service.setLocale('ar');
      expect(service.getLocale()).toBe('ar');
    });

    it('persists locale to storage', async () => {
      await service.setLocale('fr');
      expect(mockStorage.setLocale).toHaveBeenCalledWith('fr');
    });

    it('applies direction via adapter', async () => {
      await service.setLocale('ar');
      expect(mockAdapter.apply).toHaveBeenCalledWith('rtl', 'ar');
    });

    it('triggers manager.loadLocale via the wired bridge', async () => {
      const loadSpy = vi.spyOn(manager, 'loadLocale').mockResolvedValue(undefined);
      await service.setLocale('ar');
      expect(loadSpy).toHaveBeenCalledWith('ar');
    });

    it('notifies subscribers after a successful switch', async () => {
      const listener = vi.fn();
      service.subscribe(listener);
      await service.setLocale('ar');
      expect(listener).toHaveBeenCalledWith('ar');
    });

    it('throws for unsupported locale', async () => {
      await expect(service.setLocale('de')).rejects.toThrow('not supported');
    });

    it('returns false when locale does not change', async () => {
      const result = await service.setLocale('en');
      expect(result).toBe(false);
    });

    it('returns true when adapter signals restart needed', async () => {
      (mockAdapter.apply as any).mockReturnValue(true);
      const result = await service.setLocale('ar');
      expect(result).toBe(true);
    });
  });

  describe('getPersistedLocale()', () => {
    it('returns stored locale if supported', async () => {
      (mockStorage.getLocale as any).mockResolvedValue('fr');
      expect(await service.getPersistedLocale()).toBe('fr');
    });

    it('returns null if stored locale is not supported', async () => {
      (mockStorage.getLocale as any).mockResolvedValue('de');
      expect(await service.getPersistedLocale()).toBeNull();
    });

    it('returns null if no stored locale', async () => {
      (mockStorage.getLocale as any).mockResolvedValue(null);
      expect(await service.getPersistedLocale()).toBeNull();
    });
  });

  describe('onModuleInit / onApplicationBootstrap', () => {
    it('wires manager.setLocaleGetter to read from the service', () => {
      // The bridge is set up in beforeEach; manager should read the
      // service's current locale live.
      expect(manager.getCurrentLocale()).toBe('en');
    });

    it('hydrates a persisted locale on bootstrap', async () => {
      (mockStorage.getLocale as any).mockResolvedValue('ar');
      const loadSpy = vi.spyOn(manager, 'loadLocale').mockResolvedValue(undefined);
      await service.onApplicationBootstrap();
      expect(service.getLocale()).toBe('ar');
      expect(loadSpy).toHaveBeenCalledWith('ar');
    });

    it('fires the initial load when no persisted locale exists', async () => {
      (mockStorage.getLocale as any).mockResolvedValue(null);
      const loadSpy = vi.spyOn(manager, 'loadLocale').mockResolvedValue(undefined);
      await service.onApplicationBootstrap();
      expect(loadSpy).toHaveBeenCalledWith('en');
    });
  });
});
