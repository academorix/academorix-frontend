/**
 * @file index.ts
 * @module @stackra/config
 * @description Public API for `@stackra/config` — configuration + DI
 *   namespace registry, derived from `@nestjs/config@4.0.4` and
 *   adapted for browser + Vite.
 *
 *   This barrel exports ONLY package-owned symbols. Every interface,
 *   type alias, and DI token used by consumers lives in
 *   `@stackra/contracts` and must be imported directly from there
 *   (per `.kiro/steering/contract-reexports.md`).
 *
 *   Layout:
 *   - Runtime classes: `ConfigModule`, `ConditionalModule`,
 *     `ConfigService`.
 *   - Authoring helpers: `registerAs`, `getConfigToken`, `env`.
 *   - Deprecation shim: `defineConfig` (removed in v0.2).
 *   - Errors: `ConfigError` + 5 subclasses.
 *   - Consumer-facing utility type: `ConfigType`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ────────────────────────────────────────────────────────────────────
// Runtime classes
// ────────────────────────────────────────────────────────────────────
export { ConfigModule } from "./config.module";
export { ConditionalModule } from "./conditional.module";
export { ConfigService } from "./services";

// ────────────────────────────────────────────────────────────────────
// Authoring helpers
// ────────────────────────────────────────────────────────────────────
export { registerAs } from "./utils/register-as.util";
export { getConfigToken } from "./utils/get-config-token.util";
export { env } from "./utils/env.util";

// ────────────────────────────────────────────────────────────────────
// Deprecation shim — removed in v0.2
// ────────────────────────────────────────────────────────────────────
export { defineConfig } from "./utils/define-config.util";

// ────────────────────────────────────────────────────────────────────
// Errors — every subclass extends `ConfigError`, so a single
// `instanceof ConfigError` catches the whole family.
// ────────────────────────────────────────────────────────────────────
export {
  ConfigError,
  ConfigMissingKeyError,
  ConfigReadonlyError,
  ConfigValidationError,
  ConfigEnvMissingError,
  ConfigEnvInvalidError,
} from "./errors";

// ────────────────────────────────────────────────────────────────────
// ConfigType — resolves the awaited return type of a registered
// factory. Consumer-facing utility type, not in contracts because
// its natural home is the runtime package that ships `registerAs`.
// ────────────────────────────────────────────────────────────────────

/**
 * Resolves the awaited return type of a `registerAs(...)` factory.
 *
 * Consumers use this at inject sites to type the config object
 * without hand-repeating the factory shape:
 *
 * @example
 * ```typescript
 * import { Inject, Injectable } from '@stackra/container';
 * import type { ConfigType } from '@stackra/config';
 *
 * import { cacheConfig } from '@/config/cache.config';
 *
 * @Injectable()
 * class CacheDebugger {
 *   public constructor(
 *     @Inject(cacheConfig.KEY) private readonly cfg: ConfigType<typeof cacheConfig>,
 *   ) {}
 * }
 * ```
 */
export type ConfigType<TFactory extends (...args: any[]) => any> = Awaited<ReturnType<TFactory>>;
