/**
 * @file default-devtools-config.constants.ts
 * @module @stackra/devtools/core/constants
 * @description Default configuration for `DevtoolsModule.forRoot()`.
 *
 *   `enabled` resolves at module-eval time via
 *   `!Env.isProduction()` — the whole shell is on in development
 *   and off in production. Consumers may override this explicitly.
 *
 *   The default `categoryOrder` mirrors the canonical rendering
 *   order used by both the web and native shells.
 */

import { Env } from '@stackra/support';
import type { DevtoolsCategory } from '@stackra/contracts';

import type { IDevtoolsModuleOptions } from '../interfaces/devtools-module-options.interface';

/**
 * Canonical order in which `DevtoolsCategory` sections appear in the
 * nav rail. Empty categories are skipped at render time regardless
 * of their position in this list.
 */
export const DEFAULT_DEVTOOLS_CATEGORY_ORDER: readonly DevtoolsCategory[] = [
  'pinned',
  'app',
  'framework',
  'data',
  'ui',
  'network',
  'observability',
  'modules',
];

/**
 * Minimum + maximum drawer size (in CSS pixels) — enforced by
 * `mergeConfig` so a rogue caller can't collapse the shell to zero
 * or make it larger than the viewport.
 */
export const DEVTOOLS_SIZE_BOUNDS = {
  /** Minimum size in CSS pixels. */
  MIN: 240,
  /** Maximum size in CSS pixels. */
  MAX: 1200,
} as const;

/**
 * Default configuration for {@link IDevtoolsModuleOptions}.
 *
 * @remarks Evaluated once at module load — `Env.isProduction()` is
 *   read from `process.env.NODE_ENV` (or the equivalent
 *   `import.meta.env`) at that moment. Bundlers that stamp
 *   `NODE_ENV` at build time will tree-shake the shell out of the
 *   final bundle when `enabled` is `false`.
 */
export const DEFAULT_DEVTOOLS_CONFIG: IDevtoolsModuleOptions = {
  // `enabled` is resolved eagerly so bundlers can constant-fold
  // the value and tree-shake the shell in production builds.
  enabled: !Env.isProduction(),
  position: 'right',
  initialSize: 480,
  shortcut: { meta: true, shift: true, key: 'd' },
  storage: 'localStorage',
  categoryOrder: DEFAULT_DEVTOOLS_CATEGORY_ORDER,
  minimizeInactive: 0,
  analytics: true,
};
