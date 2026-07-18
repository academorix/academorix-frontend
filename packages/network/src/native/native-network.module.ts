/**
 * @file native-network.module.ts
 * @module @stackra/network/native
 * @description NativeNetworkModule — wraps core NetworkModule with
 *   the React Native NetInfo detector for seamless mobile network monitoring.
 *   Provides the detector via DI (useClass) rather than manual instantiation.
 */

import { Module } from "@stackra/container";
import type { DynamicModule } from "@stackra/container";
import { NETWORK_DETECTOR } from "@stackra/contracts";
import { NetworkModule } from "../core/network.module";
import type { NetworkModuleOptions } from "../core/interfaces";
import { NativeNetworkDetector } from "./detectors";

// ── Module ──────────────────────────────────────────────────────────────────

/**
 * NativeNetworkModule — wraps {@link NetworkModule} with the React Native
 * {@link NativeNetworkDetector} for automatic connectivity monitoring.
 *
 * Uses proper DI registration (useClass) instead of manual instantiation.
 * The NativeNetworkDetector is provided under the `NETWORK_DETECTOR` token
 * so the core NetworkService can inject it.
 *
 * @example
 * ```typescript
 * import { NativeNetworkModule } from '@stackra/network/native';
 *
 * @Module({
 *   imports: [NativeNetworkModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NativeNetworkModule {
  /**
   * Configure the native network module with the NetInfo-based detector.
   *
   * @param options - Optional core NetworkModule options (excluding detector)
   * @returns Dynamic module configuration with core NetworkModule imported
   *
   * @example
   * ```typescript
   * NativeNetworkModule.forRoot();
   * ```
   */
  public static forRoot(options?: Partial<Omit<NetworkModuleOptions, "detector">>): DynamicModule {
    // Own the `NETWORK_DETECTOR` → `NativeNetworkDetector` binding here
    // (the platform-abstraction pattern) and mark the module `global: true`
    // so the binding reaches `NetworkService`, which is registered inside
    // the imported `NetworkModule`. See `WebNetworkModule.forRoot` for
    // the same rationale.
    return {
      module: NativeNetworkModule,
      global: true,
      imports: [NetworkModule.forRoot(options)],
      providers: [
        NativeNetworkDetector,
        { provide: NETWORK_DETECTOR, useClass: NativeNetworkDetector },
      ],
      exports: [NETWORK_DETECTOR],
    };
  }
}
