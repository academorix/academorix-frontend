/**
 * @file network.config.ts
 * @module @stackra/network/config
 * @description Consumer template for the network module's namespaced
 *   configuration factory.
 *
 *   Copy this file into your app's `src/config/` directory and
 *   customise. The single call to `registerAs('network', ...)` from
 *   `@stackra/config` binds the return value under a namespaced DI
 *   token (`networkConfig.KEY`) and attaches an `.asProvider()`
 *   helper for `NetworkModule.forRootAsync(...)`.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { NetworkModule } from '@stackra/network';
 * import { networkConfig } from '@/config/network.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [networkConfig] }),
 *     NetworkModule.forRootAsync(networkConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { registerAs } from "@stackra/config";
import type { NetworkModuleOptions } from "@stackra/network";

/**
 * Network configuration namespace — reachable via
 * `ConfigService.get('network')` and typed at inject sites through
 * `ConfigType<typeof networkConfig>`.
 */
export const networkConfig = registerAs<NetworkModuleOptions>("network", () => ({
  // |--------------------------------------------------------------------------
  // | Global Registration
  // |--------------------------------------------------------------------------
  // | When true, the module's exports are available application-wide without
  // | explicit imports in every feature module.
  // |
  global: true,

  // |--------------------------------------------------------------------------
  // | Logging
  // |--------------------------------------------------------------------------
  // | Verbosity for network-related log messages. Overridden by the centralized
  // | `logging.config.ts` in applications.
  // |
  logging: "info",

  // |--------------------------------------------------------------------------
  // | Detector
  // |--------------------------------------------------------------------------
  // | Platform-specific network detector. Choose based on your environment:
  // |
  // |   - BrowserNetworkDetector  — Web (uses navigator.onLine + Network Info API)
  // |   - NodeNetworkDetector     — Node.js (DNS polling)
  // |   - NativeNetworkDetector   — React Native (uses @react-native-community/netinfo)
  // |
  // | Example:
  // |   detector: new BrowserNetworkDetector(),
  // |
  detector: undefined,
}));
