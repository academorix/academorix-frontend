/**
 * @file plugin-map.interface.ts
 * @module @stackra/vite/core/interfaces
 * @description Record of plugin-name → {@link IPluginEntry} envelope.
 *   Each entry keeps its own `TOptions` — the `any` bound on the
 *   index signature keeps every entry compatible while preserving
 *   per-entry inference at the call site.
 */

import type { IPluginEntry } from "./plugin-entry.interface";

/**
 * A record mapping plugin names to their {@link IPluginEntry}
 * envelopes. The key is arbitrary (the plugin's conventional name
 * — `react`, `tsconfigPaths`, `tailwindcss`) and the value is the
 * `{ enabled, factory, options }` triple.
 *
 * The index signature uses `IPluginEntry<any>` on purpose: the
 * alternative (`IPluginEntry<unknown>`) breaks inference at
 * consumer sites, because each entry has its own concrete
 * `TOptions` and `unknown` refuses assignment to a narrower type.
 * This is one of the rare cases where `any` is the correct answer.
 *
 * @example
 * ```typescript
 * import react from '@vitejs/plugin-react-swc';
 * import tsconfigPaths from 'vite-tsconfig-paths';
 * import type { IPluginMap } from '@stackra/vite';
 *
 * const plugins: IPluginMap = {
 *   react: { enabled: true, factory: react, options: { tsDecorators: true } },
 *   tsconfigPaths: { enabled: true, factory: tsconfigPaths, options: {} },
 * };
 * ```
 */
export interface IPluginMap {
  // Index signature — `any` on TOptions is deliberate (see file-level
  // comment). Every value is an IPluginEntry envelope; there are no
  // "special" keys.
  readonly [name: string]: IPluginEntry<any>;
}
