/**
 * @file settings.context.ts
 * @module @stackra/settings/react/contexts/settings
 * @description React context for the SettingsProvider.
 *
 *   Consumers rarely read this context directly — most components
 *   inject `SETTINGS_SERVICE` via `useInject`. The context exposes a
 *   small bootstrap-readiness signal for apps that want to gate their
 *   UI on the initial schema fetch (opt-in via
 *   `SettingsProvider ready="waitSchema"`).
 */

import { createContext } from 'react';

import type { ISettingsContextValue } from './settings.interface';

/**
 * Context value seeded by `SettingsProvider`.
 *
 * `null` when the provider is absent — components can then fall back
 * to a "ready-by-default" pathway.
 */
export const SettingsContext = createContext<ISettingsContextValue | null>(null);
