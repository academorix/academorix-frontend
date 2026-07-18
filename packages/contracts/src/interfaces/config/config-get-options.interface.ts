/**
 * @file config-get-options.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Marker options for the type-inferring overloads of
 *   `ConfigService.get` / `ConfigService.getOrThrow`.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.service.ts (ConfigGetOptions) (MIT, © Kamil Myśliwiec)
 */

/**
 * Marker options that switch a `ConfigService.get` call into its
 * type-inferring overload.
 *
 * When `infer: true` is passed as the trailing argument, TypeScript
 * uses the `ConfigService<K>` class-level type parameter to narrow
 * both the accepted property path (`Path<K>`) and the returned value
 * (`PathValue<K, P>`).
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * interface AppConfig {
 *   database: { host: string; port: number };
 * }
 * const config = new ConfigService<AppConfig>();
 * const host = config.get('database.host', { infer: true });
 * //    ^ string — narrowed via Path<AppConfig> + PathValue<AppConfig, 'database.host'>
 * ```
 */
export interface IConfigGetOptions {
  /**
   * When `true`, `ConfigService.get` uses the class-level generic to
   * infer the property-path type and the return type. Must be a
   * literal `true` — the marker is a discriminator, not a toggle.
   */
  infer: true;
}
