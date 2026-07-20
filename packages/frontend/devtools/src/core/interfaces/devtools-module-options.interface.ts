/**
 * @file devtools-module-options.interface.ts
 * @module @stackra/devtools/core/interfaces
 * @description Options accepted by `DevtoolsModule.forRoot` +
 *   composite family (`IDevtoolsShortcut` + `IDevtoolsModuleAsyncOptions`).
 *
 *   The family lives in one file per `code-standards.md`'s composite-
 *   family exception — `IDevtoolsShortcut` is only used as a field of
 *   `IDevtoolsModuleOptions` and `IDevtoolsModuleAsyncOptions` is
 *   only consumed by the module's static factories. Both are family
 *   members of the outer options contract.
 */

import type { DevtoolsCategory } from '@stackra/contracts';

import type { DevtoolsShellPosition } from '../types/devtools-shell-position.type';

// ════════════════════════════════════════════════════════════════════
// Shortcut — keyboard combo the shell listens for
// ════════════════════════════════════════════════════════════════════

/**
 * Keyboard combination that toggles the devtools shell open/closed.
 *
 * Every modifier is optional; the `key` matches
 * `KeyboardEvent.key.toLowerCase()`. Set the whole `shortcut` field
 * to `false` on {@link IDevtoolsModuleOptions} to disable the
 * shortcut binding entirely.
 *
 * @example
 * ```typescript
 * // Cmd/Ctrl + Shift + D  (workspace default)
 * { meta: true, shift: true, key: 'd' }
 * // Ctrl + F12
 * { ctrl: true, key: 'f12' }
 * ```
 */
export interface IDevtoolsShortcut {
  /** Whether the Command/Windows key must be held. */
  readonly meta?: boolean;
  /** Whether the Ctrl key must be held. */
  readonly ctrl?: boolean;
  /** Whether the Alt/Option key must be held. */
  readonly alt?: boolean;
  /** Whether the Shift key must be held. */
  readonly shift?: boolean;
  /** The primary key (matched against `KeyboardEvent.key.toLowerCase()`). */
  readonly key: string;
}

// ════════════════════════════════════════════════════════════════════
// Module options — root contract
// ════════════════════════════════════════════════════════════════════

/**
 * Options accepted by `DevtoolsModule.forRoot(options)`. Every field
 * is optional; unset values fall back to `DEFAULT_DEVTOOLS_CONFIG`
 * (via `mergeConfig`).
 *
 * @example
 * ```typescript
 * DevtoolsModule.forRoot({
 *   position: 'bottom',
 *   initialSize: 640,
 *   shortcut: { meta: true, shift: true, key: 'd' },
 * });
 * ```
 */
export interface IDevtoolsModuleOptions {
  /**
   * Master switch. When `false`, the entire shell short-circuits to
   * `null` in the React tree and every subscription is skipped.
   *
   * @default `!Env.isProduction()`
   */
  readonly enabled?: boolean;

  /**
   * Which edge the shell slides in from.
   *
   * @default 'right'
   */
  readonly position?: DevtoolsShellPosition;

  /**
   * Initial shell size in CSS pixels — width when position is
   * `'left'`/`'right'`, height when `'top'`/`'bottom'`. Clamped to
   * `[240, 1200]` by `mergeConfig`.
   *
   * @default 480
   */
  readonly initialSize?: number;

  /**
   * Keyboard combo that toggles the shell. Set to `false` to
   * disable the binding entirely.
   *
   * @default { meta: true, shift: true, key: 'd' }
   */
  readonly shortcut?: IDevtoolsShortcut | false;

  /**
   * Named `@stackra/storage` instance backing frame-state
   * persistence (open state, active panel id, position, size).
   * Ignored when `@stackra/storage` isn't installed.
   *
   * @default 'localStorage'
   */
  readonly storage?: string;

  /**
   * Order in which categorised sections appear in the nav rail.
   * Empty categories are skipped regardless of this value.
   *
   * @default ['pinned','app','framework','data','ui','network','observability','modules']
   */
  readonly categoryOrder?: readonly DevtoolsCategory[];

  /**
   * Milliseconds of inactivity after which the shell auto-minimises
   * back to the launcher pill. `0` disables auto-minimise.
   *
   * @default 0
   */
  readonly minimizeInactive?: number;

  /**
   * Emit analytics events (`ACTION_TRIGGERED`, `PANEL_ACTIVATED`, …)
   * via `@stackra/events`' `EVENT_EMITTER` when present.
   *
   * @default true
   */
  readonly analytics?: boolean;
}

// ════════════════════════════════════════════════════════════════════
// Async options — for forRootAsync
// ════════════════════════════════════════════════════════════════════

/**
 * Options accepted by `DevtoolsModule.forRootAsync`. Mirrors the
 * `TypedDynamicModuleAsyncOptions` shape used by other workspace
 * packages (cache / http / storage).
 */
export interface IDevtoolsModuleAsyncOptions {
  /** Factory that returns (possibly asynchronously) the resolved options. */
  readonly useFactory: (
    ...args: readonly unknown[]
  ) => IDevtoolsModuleOptions | Promise<IDevtoolsModuleOptions>;
  /**
   * Injection tokens passed to the factory in declaration order.
   *
   * @default []
   */
  readonly inject?: readonly unknown[];
}
