/**
 * @file as-provider-method-key.constant.ts
 * @module @stackra/config/core/constants
 * @description Property key under which a `registerAs(...)` factory
 *   exposes its `.asProvider()` helper.
 *
 *   Consumers spell it as `factory.asProvider()`; the string is fixed
 *   so downstream `<X>Module.forRootAsync(cfg.asProvider())` calls
 *   read naturally in TypeScript. Stamped by `registerAs` via
 *   `Object.defineProperty`.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (AS_PROVIDER_METHOD_KEY) (MIT, © Kamil Myśliwiec)
 */

/**
 * String method name under which a `registerAs(...)` factory exposes
 * its `.asProvider()` self-descriptor.
 *
 * The returned object matches `IConfigModuleAsyncOptions` exactly, so
 * a call site can plug `cfg.asProvider()` straight into
 * `<X>Module.forRootAsync`.
 */
export const AS_PROVIDER_METHOD_KEY = "asProvider" as const;
