/**
 * @file create-mock-devtools-panel.util.ts
 * @module @stackra/devtools/testing
 * @description Factory that returns a fully-typed
 *   `IDevtoolsPanel` with sensible defaults — used by test cases
 *   that need "a panel" without caring about the specifics.
 */

import type { IDevtoolsPanel, IDevtoolsView } from '@stackra/contracts';

/**
 * Default component view — renders `null`. Overridden when the
 * caller passes a custom `view` in `overrides`.
 */
const DEFAULT_VIEW: IDevtoolsView = {
  type: 'component',
  render: () => null,
};

/**
 * Build a minimal, valid `IDevtoolsPanel`. Every field except `id`
 * has a sensible default; pass `overrides` to steer any subset of
 * the panel shape.
 *
 * @example
 * ```typescript
 * const panel = createMockDevtoolsPanel({ id: 'my-panel' });
 * registry.register(panel);
 * ```
 */
export function createMockDevtoolsPanel(overrides: Partial<IDevtoolsPanel> = {}): IDevtoolsPanel {
  const id = overrides.id ?? 'mock-panel';
  return {
    id,
    title: overrides.title ?? id,
    category: overrides.category ?? 'modules',
    order: overrides.order ?? 100,
    view: overrides.view ?? DEFAULT_VIEW,
    ...(overrides.icon !== undefined ? { icon: overrides.icon } : {}),
    ...(overrides.requireAuth ? { requireAuth: overrides.requireAuth } : {}),
    ...(overrides.badge ? { badge: overrides.badge } : {}),
    ...(overrides.onActivate ? { onActivate: overrides.onActivate } : {}),
    ...(overrides.onDeactivate ? { onDeactivate: overrides.onDeactivate } : {}),
  };
}
