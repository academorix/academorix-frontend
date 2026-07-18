/**
 * @file config-factory.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Callable shape of a config factory produced by
 *   `registerAs`.
 *
 * @derived @nestjs/config@4.0.4 — lib/interfaces/config-factory.interface.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Callable shape of a configuration factory.
 *
 * A `registerAs('<name>', factory)` call decorates the passed function
 * with a `.KEY` symbol + `.asProvider()` method (see
 * `IConfigFactoryKeyHost`) and returns the same reference. The
 * factory itself is invoked once during `ConfigModule.forRoot({ load })`;
 * its return value is merged into the internal configuration host.
 *
 * The optional `namespace` metadata property is a **Stackra addition**
 * — nestjs stores the namespace on non-enumerable helper properties
 * (`PARTIAL_CONFIGURATION_KEY`) that consumers cannot introspect.
 * Ours exposes it directly for tooling (Vite plugin, JSON schema
 * export). Assigned by `registerAs`; consumers should treat it as
 * read-only.
 *
 * @typeParam T - Shape of the config object produced by the factory.
 * @publicApi
 *
 * @example
 * ```typescript
 * import { registerAs } from '@stackra/config';
 * import type { IConfigFactory } from '@stackra/contracts';
 *
 * export const cacheConfig: IConfigFactory<{ ttl: number }> = registerAs(
 *   'cache',
 *   () => ({ ttl: 3600 }),
 * );
 * ```
 */
export interface IConfigFactory<T = unknown> {
  /** Invoked once during `ConfigModule.forRoot({ load })`. */
  (): T | Promise<T>;

  /**
   * Namespace this factory registered under. **Stackra addition**
   * (not present in `@nestjs/config`); set by `registerAs`. Read-only
   * once assigned.
   */
  readonly namespace?: string;
}
