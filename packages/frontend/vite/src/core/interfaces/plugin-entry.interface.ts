/**
 * @file plugin-entry.interface.ts
 * @module @stackra/vite/core/interfaces
 * @description Envelope for a single plugin entry in the plugin map.
 *   {@link IPluginEntry} declares the `{ enabled, factory, options }`
 *   shape that lets consumers toggle plugins on / off at the map
 *   level without editing the invocation site.
 */

import type { Plugin } from "vite";

/**
 * A single plugin entry in an {@link IPluginMap}.
 *
 * Each entry is a `{ enabled, factory, options }` triple. The
 * `factory` is invoked ONLY when `enabled === true`, so a disabled
 * entry has zero side-effect cost — no plugin installation, no
 * options parsing, no runtime penalty. This is the whole reason
 * `@stackra/vite` ships an envelope instead of a bare plugin array:
 * toggling a plugin becomes a data change on the entry, not a code
 * change at the call site.
 *
 * @typeParam TOptions - Type of the options bag passed to `factory`.
 *   Defaults to `unknown`; declare a concrete type on the entry to
 *   unlock IntelliSense on the options.
 *
 * @example
 * ```typescript
 * import react from '@vitejs/plugin-react-swc';
 * import type { IPluginEntry } from '@stackra/vite';
 *
 * const reactEntry: IPluginEntry<{ tsDecorators: boolean }> = {
 *   enabled: true,
 *   factory: (opts) => react({ tsDecorators: opts.tsDecorators }),
 *   options: { tsDecorators: true },
 * };
 * ```
 */
export interface IPluginEntry<TOptions = unknown> {
  /**
   * Toggle the plugin on / off without editing the invocation.
   * `false` skips the factory entirely — the plugin never installs
   * and its options bag is never touched.
   */
  readonly enabled: boolean;

  /**
   * Factory returning the plugin instance (or an array — many Vite
   * plugins, including `@vitejs/plugin-react-swc`, return
   * `Plugin[]`). May be synchronous or asynchronous. Called ONLY
   * when `enabled` is `true`, so disabled entries have zero
   * side-effect cost.
   *
   * @param options - The `options` bag from this same entry,
   *   forwarded verbatim.
   * @returns The plugin instance, a plugin array, or a promise
   *   resolving to either.
   */
  readonly factory: (options: TOptions) => Plugin | Plugin[] | Promise<Plugin | Plugin[]>;

  /**
   * Options forwarded verbatim to `factory(...)`. Required (even if
   * `{}`) so `TOptions` gets inferred at the call site — factories
   * that take no options declare `TOptions = Record<string, never>`
   * and pass `{}` here.
   */
  readonly options: TOptions;
}
