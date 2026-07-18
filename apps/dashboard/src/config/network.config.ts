/**
 * @file network.config.ts
 * @module @academorix/dashboard/config
 * @description Network detection module configuration.
 *
 *   Authored as a `registerAs` factory so the value is reachable via
 *   `ConfigService.get('network')` AND — when threaded through
 *   `NetworkModule.forRootAsync(networkConfig.asProvider())` — through
 *   the network module's internal binding. The dashboard currently
 *   only surfaces the config through `ConfigService`.
 *
 *   ## Migration note
 *
 *   The previous form was `export default defineConfig({...})` — a
 *   default export the app.module then imported by default name. The
 *   new named-export shape (`networkConfig`) is imported explicitly
 *   everywhere.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { networkConfig } from '@/config/network.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [networkConfig] }),
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
