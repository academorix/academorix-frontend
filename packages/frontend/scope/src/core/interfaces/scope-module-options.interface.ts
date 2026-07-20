/**
 * @file scope-module-options.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description Client-side scope configuration shape.
 */

import type { IScopeContext } from './scope-context.interface';
import type { IScopeNodeTreeNode } from './scope-node-tree-node.interface';

/**
 * Scope configuration options.
 *
 * `initialScope` / `initialTree` seed the client service so the first
 * paint isn't empty (typically provided by SSR or a persisted local
 * selection). `cache` / `resolution` / `events` / `seeds` are
 * forward-compatible hints that the backend may honour; they are
 * carried on the client so the config file can be shared verbatim
 * between platforms.
 */
export interface IScopeModuleOptions {
  /**
   * Persistence backend for the active scope node id.
   *
   * - Omitted or `'memory'` → no persistence (default). Users lose
   *   their active scope selection on reload.
   * - Any other string → resolved as an `IStorage` **instance name**
   *   from the app's `StorageManager`. Set `storage: 'localStorage'`
   *   (or any name declared in `WebStorageModule.forRoot({ stores })`)
   *   and the scope module auto-wires a persist adapter that reads /
   *   writes through that instance.
   *
   * Custom drivers register via `StorageModule.forFeature(driver, Cls)`
   * and are consumed the same way — just name them in `stores` and set
   * `storage` here to that instance name.
   */
  readonly storage?: 'localStorage' | 'sessionStorage' | 'memory' | 'asyncStorage' | (string & {});

  /**
   * Storage key under the resolved `IStorage` instance.
   *
   * @default '@stackra:scope:active_node_id'
   */
  readonly storageKey?: string;

  /** Seed the active scope (e.g. from SSR / persisted state). */
  readonly initialScope?: IScopeContext | null;

  /**
   * Seed the node tree (skips the initial `loadTree` call). Provide
   * this from SSR / a cached response to render the switcher instantly
   * on first paint.
   */
  readonly initialTree?: readonly IScopeNodeTreeNode[];

  /** Client cache hints for resolved values. */
  readonly cache?: {
    readonly enabled?: boolean;
    readonly ttl?: number;
    readonly memorySize?: number;
  };

  /** Event relay hints. */
  readonly events?: {
    readonly enabled?: boolean;
    readonly channelPrefix?: string;
  };

  /** Resolution guards — honoured by the backend resolver. */
  readonly resolution?: {
    readonly maxDepth?: number;
    readonly timeoutMs?: number;
  };

  /** Seed hints — backend only; carried here for a shared config file. */
  readonly seeds?: {
    readonly strategy?: 'skip_existing' | 'overwrite' | 'fail_on_conflict';
    readonly definitions?: readonly unknown[];
  };
}
