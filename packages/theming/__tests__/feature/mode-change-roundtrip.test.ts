/**
 * @file mode-change-roundtrip.test.ts
 * @module @stackra/theming/test
 * @description Integration test: setMode → persist → restore → verify state matches.
 */

import { describe, it, expect, vi } from 'vitest';
import { ThemeService } from '@/core/services';
import { ThemeRegistry } from '@/core/registries';
import { ThemeTokenStore } from '@/core/stores';
import { IThemeBindings, ResolvedMode } from '@stackra/contracts';

describe('Mode Change Round-Trip', () => {
  function createPersistentBindings() {
    const storage = new Map<string, string>();
    const bindings: IThemeBindings = {
      getPersistedMode: () => (storage.get('mode') as any) ?? null,
      setPersistedMode: (mode) => storage.set('mode', mode),
      getPersistedTheme: () => storage.get('theme') ?? null,
      setPersistedTheme: (id) => storage.set('theme', id),
      getSystemColorScheme: () => 'light' as ResolvedMode,
      subscribeToSystemChanges: () => () => {},
      applyColorMode: vi.fn(),
      applyTokens: vi.fn(),
      getSSRScript: () => '',
    };
    return { bindings, storage };
  }

  it('should persist and restore mode across instances', () => {
    const { bindings } = createPersistentBindings();

    // First instance: set mode
    const store1 = new ThemeTokenStore();
    const registry1 = new ThemeRegistry();
    const service1 = new (ThemeService as any)(
      { defaultMode: 'system' },
      bindings,
      registry1,
      store1
    );
    service1.onModuleInit();
    service1.setMode('dark');
    expect(store1.getState().mode).toBe('dark');

    // Second instance: restore
    const store2 = new ThemeTokenStore();
    const registry2 = new ThemeRegistry();
    const service2 = new (ThemeService as any)(
      { defaultMode: 'system' },
      bindings,
      registry2,
      store2
    );
    service2.onModuleInit();
    expect(store2.getState().mode).toBe('dark');
  });

  it('should persist and restore theme across instances', () => {
    const { bindings } = createPersistentBindings();

    // First instance
    const store1 = new ThemeTokenStore();
    const registry1 = new ThemeRegistry();
    const service1 = new (ThemeService as any)(
      { defaultTheme: 'default' },
      bindings,
      registry1,
      store1
    );
    service1.onModuleInit();
    service1.setTheme('spotify');
    expect(store1.getState().themeId).toBe('spotify');

    // Second instance
    const store2 = new ThemeTokenStore();
    const registry2 = new ThemeRegistry();
    const service2 = new (ThemeService as any)(
      { defaultTheme: 'default' },
      bindings,
      registry2,
      store2
    );
    service2.onModuleInit();
    expect(store2.getState().themeId).toBe('spotify');
  });
});
