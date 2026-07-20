/**
 * @file state-registry.test.ts
 * @module @stackra/state/__tests__
 * @description Verifies StateRegistry introspection.
 */

import { describe, it, expect } from 'vitest';
import { Store } from '@tanstack/store';
import { StateRegistry } from '@/core/registries/state.registry';

describe('StateRegistry', () => {
  const THEME = Symbol.for('THEME_STORE');
  const I18N = Symbol.for('I18N_STORE');

  it('registers and indexes stores', () => {
    const registry = new StateRegistry();
    const theme = new Store({ mode: 'dark' });
    registry.registerStore('theme', THEME, theme as Store<unknown>, { mode: 'system' });

    expect(registry.getNames()).toEqual(['theme']);
    expect(registry.get('theme')?.store).toBe(theme);
    expect(registry.getAll()).toHaveLength(1);
  });

  it('snapshots current state across stores', () => {
    const registry = new StateRegistry();
    registry.registerStore('theme', THEME, new Store({ mode: 'dark' }) as Store<unknown>);
    registry.registerStore('i18n', I18N, new Store({ locale: 'en' }) as Store<unknown>);

    expect(registry.snapshot()).toEqual({
      theme: { mode: 'dark' },
      i18n: { locale: 'en' },
    });
  });

  it('allows re-registering a store name (overwrite semantics)', () => {
    const registry = new StateRegistry();
    registry.registerStore('theme', THEME, new Store({ mode: 'dark' }) as Store<unknown>);
    const replacement = new Store({ mode: 'light' });
    expect(() =>
      registry.registerStore('theme', THEME, replacement as Store<unknown>)
    ).not.toThrow();
    expect(registry.get('theme')?.store).toBe(replacement);
  });
});
