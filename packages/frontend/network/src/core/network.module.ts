/**
 * @file network.module.ts
 * @module @stackra/network
 * @description NetworkModule — DI module for network detection and monitoring.
 */

import { Module, Global } from "@stackra/container";
import type { DynamicModule, Provider } from "@stackra/container";
import { NETWORK_DETECTOR, NETWORK_SERVICE } from "@stackra/contracts";
import type { IPublishableConsumer } from "@stackra/contracts";
import { Path } from "@stackra/support";

import { NetworkService } from "./services/network.service";
import type { NetworkModuleOptions } from "./interfaces";

// ── Module Options ──────────────────────────────────────────────────────────

// ── Module ──────────────────────────────────────────────────────────────────

/**
 * NetworkModule — Registers network detection services in the DI container.
 *
 * Provides:
 * - `NETWORK_DETECTOR` — the platform-specific detector
 * - `NETWORK_SERVICE` — high-level service with event emission
 *
 * @example
 * ```typescript
 * import { NetworkModule, BrowserNetworkDetector } from "@stackra/network";
 *
 * @Module({
 *   imports: [
 *     NetworkModule.forRoot({
 *       detector: new BrowserNetworkDetector(),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class NetworkModule {
  /**
   * Absolute path to the `@stackra/network` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `@stackra/console`'s `PublishableConsumer` can auto-read it and
   * fill in `packageRoot` on every `.publish(entry)` call — the
   * module doesn't have to pass it manually.
   *
   * `../../..` walks from `packages/network/src/core/` up to
   * `packages/network/`.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  /**
   * Configure the network module with a platform-specific detector.
   *
   * @param options - Module configuration including the detector implementation
   * @returns Dynamic module configuration
   *
   * @example
   * ```typescript
   * NetworkModule.forRoot({
   *   global: true,
   *   detector: new BrowserNetworkDetector(),
   * });
   * ```
   */
  public static forRoot(options: NetworkModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [{ provide: NETWORK_SERVICE, useClass: NetworkService }];

    if (options.detector) {
      providers.unshift({ provide: NETWORK_DETECTOR, useValue: options.detector });
    }

    return {
      module: NetworkModule,
      global: options.global !== false,
      providers,
      exports: [NETWORK_DETECTOR, NETWORK_SERVICE],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/network` owns.
   *
   * Discovered at CLI boot by `@stackra/console`'s `PublishableLoader`.
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above.
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer.publish({
      tag: "network-config",
      description: "Reference @stackra/network config file for the app.",
      files: ["config/network.config.ts"],
    });
  }
}
