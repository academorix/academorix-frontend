/**
 * @file network-module-options.interface.ts
 * @module @stackra/network/src/interfaces
 * @description NetworkModuleOptions interface.
 */

import type { INetworkDetector } from "@stackra/contracts";

/**
 * Configuration options for {@link NetworkModule.forRoot}.
 *
 * The `NETWORK_DETECTOR` token itself is bound by the platform module
 * (`WebNetworkModule` / `NativeNetworkModule`) — this options bag is
 * only used for cross-cutting concerns like global-scope opt-out and
 * logging. Only advanced setups that need a hand-constructed detector
 * instance pass one here directly.
 *
 * @example
 * ```typescript
 * // Typical use — the platform module owns the token binding:
 * @Module({ imports: [WebNetworkModule.forRoot()] })
 * export class AppModule {}
 *
 * // Advanced — pre-instantiated detector:
 * NetworkModule.forRoot({ detector: new MyCustomDetector() });
 * ```
 */
export interface NetworkModuleOptions {
  /**
   * Whether to register the module globally.
   * When `true`, the module's exports are available application-wide.
   *
   * @default true
   */
  readonly global?: boolean;

  /**
   * Logging verbosity for network operations.
   * Overridden by the centralized `logging.config.ts` in applications.
   *
   * @default 'info'
   */
  readonly logging?: "debug" | "info" | "warn" | "error" | "silent";

  /**
   * Pre-instantiated platform detector for advanced setups. Bound to
   * `NETWORK_DETECTOR` via `useValue`. Under normal use, the platform
   * module (`WebNetworkModule` / `NativeNetworkModule`) owns this
   * binding and this option stays unset.
   */
  readonly detector?: INetworkDetector;
}
