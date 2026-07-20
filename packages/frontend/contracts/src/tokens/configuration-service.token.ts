/**
 * @file configuration-service.token.ts
 * @module @stackra/contracts/tokens
 * @description DI token for the `ConfigService` binding.
 *
 *   `@stackra/config`'s `ConfigModule` binds its `ConfigService`
 *   provider under this token; downstream modules that need a
 *   `useExisting` alias against the interface (`IConfigService`)
 *   resolve through it. Application code typically injects the
 *   `ConfigService` class directly.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * DI token for the `ConfigService` instance.
 *
 * Alias target for the class-level binding — allows contract-only
 * consumers to inject the service by token (`IConfigService`) without
 * importing the concrete class from `@stackra/config`.
 */
export const CONFIGURATION_SERVICE_TOKEN = Symbol("CONFIGURATION_SERVICE_TOKEN");
