/**
 * @file config.config.ts
 * @module @stackra/config/config
 * @description Consumer template for an app-level `registerAs` factory.
 *   Copy this file into your app's `src/config/` directory and
 *   customise. The single call to `registerAs('app', ...)` binds
 *   the return value under a namespaced DI token (`.KEY`) and
 *   attaches an `.asProvider()` helper for `<X>Module.forRootAsync`.
 */

import { registerAs, env } from "@stackra/config";

/**
 * Example app-level config factory.
 *
 * The factory IS the config — no separate `DEFAULT_*_CONFIG` constant,
 * no `mergeConfig` step. Defaults live inline as the second argument
 * to each `env(...)` call.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { appConfig } from '@/config/config.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [appConfig], cache: true }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export const appConfig = registerAs("app", () => ({
  /** Human-readable application name. */
  name: env("APP_NAME", "stackra-app"),

  /** HTTP server port. */
  port: env.number("PORT", 3000),

  /** Toggles verbose logging + strict-mode checks. */
  debug: env.bool("DEBUG", false),
}));
