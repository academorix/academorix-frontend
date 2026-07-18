/**
 * @file config-factory-key-host.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description The `.KEY` + `.asProvider()` decoration attached to a
 *   config factory by `registerAs`.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/register-as.util.ts (ConfigFactoryKeyHost) (MIT, © Kamil Myśliwiec)
 */

import type { DynamicModule } from "../modules/dynamic-module.interface";

/**
 * Non-callable decoration applied to a config factory by `registerAs`.
 *
 * `registerAs` returns the caller's factory function **plus** the
 * `.KEY` + `.asProvider()` members typed by this interface. `.KEY`
 * is the DI token consumers inject to receive the factory's return
 * value; `.asProvider()` produces the async-options object that
 * `<X>Module.forRootAsync` expects (imports the config's feature
 * module, wires `useFactory` to identity, and injects the factory's
 * `.KEY`).
 *
 * @typeParam T - The awaited shape produced by the factory.
 * @publicApi
 *
 * @example
 * ```typescript
 * import { registerAs } from '@stackra/config';
 *
 * const cacheConfig = registerAs('cache', () => ({ ttl: 3600 }));
 * // cacheConfig.KEY is a string DI token
 * // CacheModule.forRootAsync(cacheConfig.asProvider())
 * ```
 */
export interface IConfigFactoryKeyHost<T = unknown> {
  /**
   * DI token under which the factory's return value is bound.
   *
   * Consumers `@Inject(cfg.KEY)` to receive the typed config
   * instance. The token is derived from the namespace passed to
   * `registerAs`; consumers should never hand-construct it.
   */
  readonly KEY: string | symbol;

  /**
   * Produces the async-options object for `<X>Module.forRootAsync`.
   *
   * The returned shape matches `IConfigModuleAsyncOptions` exactly:
   * consumers plug `cfg.asProvider()` straight into a module's
   * `forRootAsync` without any glue code.
   *
   * @returns Async-options tuple `{ imports, useFactory, inject }`.
   */
  asProvider(): {
    imports: DynamicModule[];
    useFactory: (config: T) => T;
    inject: [string | symbol];
  };
}
