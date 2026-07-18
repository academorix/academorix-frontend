/**
 * @file application.config.ts
 * @module @academorix/dashboard/config
 * @description NestJS-style application bootstrap options for
 *   `Application.create()`, authored as a `registerAs` factory so the
 *   value lands both under `ConfigService.get('application')` and — if
 *   any downstream module wires
 *   `<X>Module.forRootAsync(applicationConfig.asProvider())` — under
 *   the module's internal binding.
 *
 *   Configures the following subsystems in one place:
 *
 *   - Server (port, host, prefix)
 *   - Security (helmet, CORS, cookie parser, trust proxy)
 *   - Performance (compression)
 *   - Validation (global ValidationPipe)
 *   - API documentation (Swagger/OpenAPI)
 *   - Graceful shutdown behavior
 *
 *   ## Environment Variables (via `env()` — three-source resolution:
 *   `process.env` → `import.meta.env` → `globalThis.__ENV__`)
 *
 *   | Variable        | Description                                  | Default          |
 *   |-----------------|----------------------------------------------|------------------|
 *   | `APP_NAME`      | Application name (shown in logs)             | `'Stackra API'`  |
 *   | `PORT`          | Server port                                  | `3000`           |
 *   | `HOST`          | Server bind address                          | `'0.0.0.0'`      |
 *   | `TRUST_PROXY`   | Trust X-Forwarded-* headers                  | `false`          |
 *   | `COOKIE_SECRET` | Signed cookie secret (unset = disabled)      | `undefined`      |
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { applicationConfig } from '@/config/application.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [applicationConfig] }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { env, registerAs } from "@stackra/config";
import type { IApplicationOptions } from "@stackra/contracts";

/**
 * Application configuration namespace — reachable via
 * `ConfigService.get('application')` and typed at inject sites through
 * `ConfigType<typeof applicationConfig>`.
 *
 * Every runtime-configurable field flows through `env(...)` so the
 * value tracks Doppler / dotenv changes at bootstrap without a
 * per-source resolver at each call site.
 */
export const applicationConfig = registerAs<IApplicationOptions>("application", () => ({
  /*
  |--------------------------------------------------------------------------
  | Application Identity
  |--------------------------------------------------------------------------
  |
  | The application name appears in startup logs, health check responses,
  | and error reports. The port and host determine where the server binds.
  |
  */
  name: env("APP_NAME", "Stackra API"),
  port: env.number("PORT", 3000),
  host: env("HOST", "0.0.0.0"),

  /*
  |--------------------------------------------------------------------------
  | Global Route Prefix
  |--------------------------------------------------------------------------
  |
  | All REST controllers are prefixed with this path. Set to empty string
  | to disable. Routes in `prefixExclude` bypass the prefix entirely
  | (health checks, GraphQL, metrics should be at root).
  |
  */
  prefix: "api",
  prefixExclude: ["health", "graphql", "metrics", "ready", "live"],

  /*
  |--------------------------------------------------------------------------
  | Security — Helmet
  |--------------------------------------------------------------------------
  |
  | Helmet sets various HTTP headers to help protect your app from
  | well-known web vulnerabilities. Enabled by default. Pass an object
  | to customize individual headers, or `false` to disable.
  |
  | Requires: `yarn add helmet`
  |
  */
  helmet: true,

  /*
  |--------------------------------------------------------------------------
  | Security — CORS
  |--------------------------------------------------------------------------
  |
  | Cross-Origin Resource Sharing configuration lives in its own config file.
  | See: config/cors.config.ts
  |
  | Import and pass as the `cors` option, or set `true` for built-in defaults.
  |
  */
  cors: true, // Or: import corsConfig from './cors.config'; cors: corsConfig,

  /*
  |--------------------------------------------------------------------------
  | Security — Cookie Parser
  |--------------------------------------------------------------------------
  |
  | Enables parsing of signed and unsigned cookies from request headers.
  | Set `cookieSecret` for signed cookie support.
  |
  | Requires: `yarn add cookie-parser`
  |
  | `env('COOKIE_SECRET')` returns an empty string when the variable is
  | unset. That's fine for `cookie-parser`, which treats a falsy value as
  | "no signed cookies" — same behaviour as the previous
  | `process.env.COOKIE_SECRET` (undefined) branch. Consumers who want a
  | hard-fail on missing secrets should switch to `env.orFail('COOKIE_SECRET')`.
  |
  */
  cookieParser: true,
  cookieSecret: env("COOKIE_SECRET"),

  /*
  |--------------------------------------------------------------------------
  | Security — Trust Proxy
  |--------------------------------------------------------------------------
  |
  | Enable when running behind a load balancer or reverse proxy (nginx,
  | AWS ALB, CloudFlare). This trusts X-Forwarded-* headers for accurate
  | client IP resolution in rate limiting and logging.
  |
  | Set to `true` for one proxy hop, or a number for specific depth.
  |
  */
  trustProxy: env.bool("TRUST_PROXY", false),

  /*
  |--------------------------------------------------------------------------
  | Performance — Compression
  |--------------------------------------------------------------------------
  |
  | Enables gzip/brotli response compression. Reduces payload size by
  | 60-80% for JSON responses. Disable if your reverse proxy handles
  | compression (e.g., nginx, CloudFlare).
  |
  | Requires: `yarn add compression`
  |
  */
  compression: true,

  /*
  |--------------------------------------------------------------------------
  | Validation — Global ValidationPipe
  |--------------------------------------------------------------------------
  |
  | Automatically validates and transforms all incoming request bodies
  | using class-validator decorators on DTOs.
  |
  | - `transform`: Auto-convert payloads to DTO class instances
  | - `whitelist`: Strip unknown properties not in the DTO
  | - `forbidNonWhitelisted`: Reject requests with unknown fields (400)
  |
  | Requires: `yarn add class-validator class-transformer`
  |
  */
  validation: {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  },

  /*
  |--------------------------------------------------------------------------
  | Graceful Shutdown
  |--------------------------------------------------------------------------
  |
  | When the process receives SIGTERM/SIGINT, NestJS will:
  | 1. Stop accepting new connections
  | 2. Wait for in-flight requests to complete (up to `timeout` ms)
  | 3. Call `onApplicationShutdown()` on all providers
  | 4. Close the process
  |
  | Essential for zero-downtime deployments (Kubernetes, ECS, etc.).
  |
  */
  shutdown: {
    graceful: true,
    timeout: 10_000,
  },
}));
