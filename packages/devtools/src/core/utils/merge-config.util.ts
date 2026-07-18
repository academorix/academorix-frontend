/**
 * @file merge-config.util.ts
 * @module @stackra/devtools/core/utils
 * @description Merge user-supplied devtools options with
 *   `DEFAULT_DEVTOOLS_CONFIG`.
 *
 *   The single choke point for defaults — both `forRoot` and
 *   `forRootAsync` route through it. Responsibilities:
 *
 *   - Spread defaults under user options.
 *   - Resolve `enabled` via `shouldEnableDevtools()`.
 *   - Coerce and clamp `initialSize` to `[MIN, MAX]`.
 *   - Coerce `position` to a valid `DevtoolsShellPosition`
 *     (fall back to `'right'`).
 *   - Preserve `shortcut: false` verbatim (means "disable binding").
 */

import type { DevtoolsCategory } from '@stackra/contracts';

import {
  DEFAULT_DEVTOOLS_CATEGORY_ORDER,
  DEFAULT_DEVTOOLS_CONFIG,
  DEVTOOLS_SIZE_BOUNDS,
} from '../constants/default-devtools-config.constants';
import type {
  IDevtoolsModuleOptions,
  IDevtoolsShortcut,
} from '../interfaces/devtools-module-options.interface';
import type { DevtoolsShellPosition } from '../types/devtools-shell-position.type';
import { shouldEnableDevtools } from './should-enable-devtools.util';

/** Valid positions the shell may occupy. */
const VALID_POSITIONS: readonly DevtoolsShellPosition[] = ['left', 'right', 'top', 'bottom'];

/**
 * Clamp `size` to the workspace bounds.
 *
 * @param raw - Raw user value.
 * @returns A value inside `[MIN, MAX]`.
 */
function clampSize(raw: number): number {
  const finite = Number.isFinite(raw)
    ? raw
    : (DEFAULT_DEVTOOLS_CONFIG.initialSize ?? DEVTOOLS_SIZE_BOUNDS.MIN);
  return Math.min(DEVTOOLS_SIZE_BOUNDS.MAX, Math.max(DEVTOOLS_SIZE_BOUNDS.MIN, finite));
}

/**
 * Coerce a user-supplied position to one of the valid values, or
 * fall back to the default when unknown.
 */
function coercePosition(raw: DevtoolsShellPosition | undefined): DevtoolsShellPosition {
  const fallback = DEFAULT_DEVTOOLS_CONFIG.position ?? 'right';
  if (!raw) return fallback;
  return VALID_POSITIONS.includes(raw) ? raw : fallback;
}

/**
 * Merge user options over {@link DEFAULT_DEVTOOLS_CONFIG}.
 *
 * @param options - Optional partial user options.
 * @returns Fully-resolved configuration with every default applied.
 *
 * @example
 * ```typescript
 * mergeConfig({ position: 'bottom' });
 * // → { enabled: true, position: 'bottom', initialSize: 480, ... }
 * ```
 */
export function mergeConfig(options?: IDevtoolsModuleOptions): IDevtoolsModuleOptions {
  const opts = options ?? {};

  // Explicit user override wins; otherwise fall back to
  // `!Env.isProduction()` via `shouldEnableDevtools`.
  const enabled = shouldEnableDevtools(opts.enabled);

  // Clamp the initial size — a rogue caller shouldn't be able to
  // collapse the shell to zero or make it larger than the viewport.
  const initialSize = clampSize(opts.initialSize ?? DEFAULT_DEVTOOLS_CONFIG.initialSize ?? 480);

  // Coerce position to a valid enum value — fall back to the default
  // when the caller passes an unknown string.
  const position = coercePosition(opts.position);

  // `shortcut: false` explicitly disables the binding. `undefined`
  // falls back to the default combo.
  const shortcut: IDevtoolsShortcut | false =
    opts.shortcut === false
      ? false
      : (opts.shortcut ?? (DEFAULT_DEVTOOLS_CONFIG.shortcut as IDevtoolsShortcut));

  // Category order — merge shallowly; when the caller supplies a
  // list, honour it verbatim (they may want to hide a category by
  // omitting it).
  const categoryOrder: readonly DevtoolsCategory[] =
    opts.categoryOrder ?? DEFAULT_DEVTOOLS_CATEGORY_ORDER;

  return {
    enabled,
    position,
    initialSize,
    shortcut,
    storage: opts.storage ?? DEFAULT_DEVTOOLS_CONFIG.storage,
    categoryOrder,
    minimizeInactive: opts.minimizeInactive ?? DEFAULT_DEVTOOLS_CONFIG.minimizeInactive ?? 0,
    analytics: opts.analytics ?? DEFAULT_DEVTOOLS_CONFIG.analytics ?? true,
  };
}
