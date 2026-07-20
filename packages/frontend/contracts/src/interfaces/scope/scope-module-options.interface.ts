/**
 * @file scope-module-options.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Configuration options for `ScopeModule.forRoot()`.
 */

import type { IScopeDefinitionSeed } from "./scope-types.interface";

/**
 * Configuration options for `ScopeModule.forRoot()`.
 */
export interface IScopeModuleOptions {
  /** Cache configuration. */
  cache?: {
    /** Enable Redis-backed caching. Default `true`. */
    enabled?: boolean;
    /** Cache TTL in seconds. Default `300`. */
    ttl?: number;
    /** Max entries in the LRU fallback (when Redis is unavailable). Default `1000`. */
    memorySize?: number;
  };

  /** Event emission configuration. */
  events?: {
    /** Enable event emission. Default `true`. */
    enabled?: boolean;
    /** Event channel prefix. Default `'scope'`. */
    channelPrefix?: string;
  };

  /** Resolution algorithm configuration. */
  resolution?: {
    /** Maximum allowed scope tree depth. Default `10`. */
    maxDepth?: number;
    /** Resolution timeout in milliseconds. Default `2000`. */
    timeoutMs?: number;
  };

  /** Seed handling configuration. */
  seeds?: {
    /** Strategy for existing seeds. Default `'skip_existing'`. */
    strategy?: "skip_existing" | "update_existing";
    /** Seed definitions applied on bootstrap. Default `[]`. */
    definitions?: readonly IScopeDefinitionSeed[];
  };
}
