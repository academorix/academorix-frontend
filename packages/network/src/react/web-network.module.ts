/**
 * @file web-network.module.ts
 * @module @stackra/network/react
 * @description WebNetworkModule — wraps core NetworkModule with the
 *   BrowserNetworkDetector for automatic browser-based network detection.
 *   Provides the detector via DI (useClass) rather than manual instantiation.
 */

import { Module } from "@stackra/container";
import type { DynamicModule } from "@stackra/container";
import { NETWORK_DETECTOR } from "@stackra/contracts";
import { NetworkModule } from "../core/network.module";
import type { NetworkModuleOptions } from "../core/interfaces";
import { BrowserNetworkDetector } from "./detectors";

// ── Module ──────────────────────────────────────────────────────────────────

/**
 * WebNetworkModule — wraps {@link NetworkModule} with the browser-based
 * {@link BrowserNetworkDetector} for automatic connectivity monitoring on web.
 *
 * Uses proper DI registration (useClass) instead of manual instantiation.
 * The BrowserNetworkDetector is provided under the `NETWORK_DETECTOR` token
 * so the core NetworkService can inject it.
 *
 * @example
 * ```typescript
 * import { WebNetworkModule } from '@stackra/network/react';
 *
 * @Module({
 *   imports: [WebNetworkModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class WebNetworkModule {
  /**
   * Configure the web network module with the browser-based detector.
   *
   * @param options - Optional core NetworkModule options (excluding detector)
   * @returns Dynamic module configuration with core NetworkModule imported
   *
   * @example
   * ```typescript
   * WebNetworkModule.forRoot();
   * ```
   */
  public static forRoot(options?: Partial<Omit<NetworkModuleOptions, "detector">>): DynamicModule {
    // Own the `NETWORK_DETECTOR` → `BrowserNetworkDetector` binding here
    // (the platform-abstraction pattern) and mark the module `global: true`
    // so the binding reaches `NetworkService`, which is registered inside
    // the imported `NetworkModule`. Without `global: true` the binding
    // sits in a child scope invisible to `NetworkModule`'s injector.
    return {
      module: WebNetworkModule,
      global: true,
      imports: [NetworkModule.forRoot(options)],
      providers: [
        BrowserNetworkDetector,
        { provide: NETWORK_DETECTOR, useClass: BrowserNetworkDetector },
      ],
      exports: [NETWORK_DETECTOR],
    };
  }
}
