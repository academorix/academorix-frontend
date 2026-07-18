/**
 * @file validated-env-propname.constant.ts
 * @module @stackra/config/core/constants
 * @description Property key under which `ConfigModule` stores the
 *   validated env record on the internal configuration host.
 *
 *   Package-internal — never exposed to consumers. Reading validated
 *   env from `ConfigService` bypasses this constant (the service
 *   already knows where to look); only the loader that WRITES the
 *   validated record needs to reference it.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.constants.ts (VALIDATED_ENV_PROPNAME) (MIT, © Kamil Myśliwiec)
 */

/**
 * String property key that identifies the validated-env slot on the
 * internal configuration host record.
 *
 * The `VALIDATED_ENV_LOADER` provider writes to `host[VALIDATED_ENV_PROPNAME]`
 * after schema validation succeeds; `ConfigService.get` reads from
 * that slot before falling through to `process.env`. Kept as a
 * plain string (not a DI token) because it's a data-shape marker,
 * not an injectable.
 */
export const VALIDATED_ENV_PROPNAME = "__VALIDATED_ENV__" as const;
