/**
 * @file settings-provider.interface.ts
 * @module @stackra/settings/react/providers/settings-provider
 * @description Props accepted by `SettingsProvider`.
 */

import type { ReactNode } from 'react';
import type { ISettingDefinition } from '@stackra/contracts';

/** Props accepted by `SettingsProvider`. */
export interface ISettingsProviderProps {
  /** Rendered children. */
  readonly children: ReactNode;

  /**
   * Optional server-side schema hydration payload. When provided,
   * every entry is registered into `SETTINGS_REGISTRY` on mount so
   * the first render observes the full schema without a network
   * round-trip. Useful for SSR + streaming boot flows.
   */
  readonly initialSchema?: readonly ISettingDefinition[];

  /**
   * Optional server-side values hydration payload. Merged into the
   * service cache via `service.hydrateAll` on mount.
   */
  readonly initialValues?: Record<string, Record<string, unknown>>;

  /**
   * Boot-readiness contract:
   * - `'immediate'` (default) — the provider reports `ready: true`
   *   right away. Callers that don't gate on the schema fetch use
   *   this mode.
   * - `'waitSchema'` — the provider defers `ready: true` until the
   *   `SETTINGS_EVENTS.SCHEMA_LOADED` event fires or the initial
   *   schema hydration completes. Use this when the remote schema
   *   loader is enabled and the UI must not render field
   *   descriptors that don't exist yet.
   */
  readonly ready?: 'immediate' | 'waitSchema';

  /**
   * Optional fallback rendered while `ready` is `false`. Only
   * observed when `ready === 'waitSchema'`.
   */
  readonly fallback?: ReactNode;
}
