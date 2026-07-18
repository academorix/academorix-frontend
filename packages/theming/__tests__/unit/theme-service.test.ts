/**
 * @file theme-service.test.ts
 * @module @stackra/theming/test
 * @description Unit tests for ThemeService.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeService } from '@/core/services';
import { ThemeRegistry } from '@/core/registries';
import { ThemeTokenStore } from '@/core/stores';
import { ThemeNotFoundError } from '@/core/errors';
import { IThemeBindings, ResolvedMode } from '@stackra/contracts';

/** Mock bindings for testing. */
function createMockBindings(): IThemeBindings {
  return {
    getPersistedMode: vi.fn(() => null),
    setPersistedMode: vi.fn(),
    getPersistedTheme: vi.fn(() => null),
    setPersistedTheme: vi.fn(),
    getSystemColorScheme: vi.fn(() => 'light' as ResolvedMode),
    subscribeToSystemChanges: vi.fn(() => () => {}),
    applyColorMode: vi.fn(),
    applyTokens: vi.fn(),
    getSSRScript: vi.fn(() => ''),
  };
}

describe('ThemeService', () => {
  let service: ThemeService;
  let bindings: IThemeBindings;
  let registry: ThemeRegistry;
  let store: ThemeTokenStore;

  beforeEach(() => {
    bindings = createMockBindings();
    registry = new ThemeRegistry();
    store = new ThemeTokenStore();

    // Manually construct the service (bypassing DI for unit tests)
    service = new (ThemeService as any)(
      { defaultTheme: 'default', defaultMode: 'system' },
      bindings,
      registry,
      store
    );

    // Trigger init
    service.onModuleInit();
  });

  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state.themeId).toBe('default');
    expect(state.mode).toBe('system');
  });

  it('should seed built-in themes on init', () => {
    expect(registry.has('default')).toBe(true);
    expect(registry.has('sky')).toBe(true);
    expect(registry.getThemes()).toHaveLength(11);
  });

  it('setMode should persist and apply', () => {
    service.setMode('dark');
    expect(bindings.setPersistedMode).toHaveBeenCalledWith('dark');
    expect(bindings.applyColorMode).toHaveBeenCalledWith('dark');
    expect(store.getState().mode).toBe('dark');
    expect(store.getState().resolvedMode).toBe('dark');
  });

  it('setMode system should resolve via bindings', () => {
    (bindings.getSystemColorScheme as any).mockReturnValue('dark');
    service.setMode('system');
    expect(bindings.applyColorMode).toHaveBeenCalledWith('dark');
    expect(store.getState().resolvedMode).toBe('dark');
  });

  it('setTheme should persist for valid theme', () => {
    service.setTheme('sky');
    expect(bindings.setPersistedTheme).toHaveBeenCalledWith('sky');
    expect(store.getState().themeId).toBe('sky');
  });

  it('setTheme should throw for unknown theme', () => {
    expect(() => service.setTheme('nonexistent')).toThrow(ThemeNotFoundError);
  });

  it('should restore persisted mode on init', () => {
    (bindings.getPersistedMode as any).mockReturnValue('dark');
    (bindings.getPersistedTheme as any).mockReturnValue('mint');

    const service2 = new (ThemeService as any)(
      { defaultTheme: 'default', defaultMode: 'system' },
      bindings,
      new ThemeRegistry(),
      new ThemeTokenStore()
    );
    service2.onModuleInit();

    expect(bindings.applyColorMode).toHaveBeenCalledWith('dark');
  });
});
