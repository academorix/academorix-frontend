/**
 * @file env.config.ts
 * @module config/env.config
 *
 * @description
 * Type-safe, schema-validated access to the browser-exposed environment.
 *
 * All keys must be prefixed `VITE_*` (Vite enforces this at build time and
 * strips everything else). We fail fast at startup on any malformed value so
 * a misconfigured deployment can't silently boot with degraded behaviour.
 *
 * ## API
 *
 * Two ways to consume:
 *
 * 1. **Pre-parsed config object** ({@link envConfig}) — the common case. All
 *    known variables are validated once at module init and exposed as a
 *    strongly-typed, `Object.freeze`d record.
 *
 *    ```ts
 *    import { envConfig } from "@/config/env.config";
 *
 *    fetch(envConfig.apiUrl);
 *    if (envConfig.appEnv === "production") { ... }
 *    ```
 *
 * 2. **Ad-hoc generic reader** ({@link env}) — for one-off env vars that
 *    don't warrant a permanent slot in the config surface (e.g. a temporary
 *    feature flag, a build-time marker consumed by a single file).
 *
 *    ```ts
 *    import { env } from "@/config/env.config";
 *    import { z } from "zod";
 *
 *    const timeoutMs = env("VITE_FEATURE_X_TIMEOUT_MS", 5000, z.coerce.number());
 *    const debugMode = env("VITE_DEBUG", false);
 *    ```
 *
 * ## Host-aware runtime
 *
 * The alignment plan (see `.kiro/specs/backend-frontend-alignment/PLAN.md`)
 * introduces a **host-aware** runtime: the SPA lives at `academorix.app`
 * (workspace picker), `admin.academorix.app` (platform admin surface) and
 * `{slug}.academorix.app` (tenant subdomains + custom domains). This module
 * exposes the raw values; `@/lib/http/host` derives the active host context.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Low-level primitive: env<T>(key, default, schema?)
// ---------------------------------------------------------------------------

/** Vite substitutes missing vars with `undefined`; some CI systems inject empty strings. */
const EMPTY_STRING_VALUES = new Set(["", "undefined", "null"]);

/**
 * Reads a `VITE_*` env var from `import.meta.env`. Returns `undefined`
 * when the key is absent, empty, or literally `"undefined"` / `"null"` so
 * downstream code can uniformly fall back to defaults.
 */
function readRawEnv(key: string): string | undefined {
  const raw = (import.meta.env as Record<string, unknown>)[key];

  if (raw === undefined || raw === null) {
    return undefined;
  }

  const str = String(raw);

  return EMPTY_STRING_VALUES.has(str) ? undefined : str;
}

/**
 * Generic, type-safe environment variable reader.
 *
 * When called without a `schema`, the return type is inferred from
 * `defaultValue`:
 *
 *  - `string` default → returns the raw string when present, else default.
 *  - `number` default → coerces via `Number(raw)`; falls back on `NaN`.
 *  - `boolean` default → accepts `"true"`, `"1"`, `"yes"` (case-insensitive) as
 *    `true`; anything else present as `false`.
 *
 * When called with a Zod schema, the raw value (or the default when
 * missing) is passed through `safeParse` and any validation failure
 * throws — the intended behaviour for boot-time verification.
 *
 * @param key - The env var name (must start with `VITE_`).
 * @param defaultValue - Fallback returned when the var is absent or empty.
 * @param schema - Optional Zod schema for structural validation.
 * @returns The parsed value.
 * @throws Error when the value fails schema validation.
 *
 * @example Basic reads (no schema)
 * ```ts
 * const port = env("VITE_PORT", 3000);              // number
 * const host = env("VITE_HOST", "localhost");       // string
 * const debug = env("VITE_DEBUG", false);           // boolean
 * ```
 *
 * @example Schema-validated
 * ```ts
 * const tier = env("VITE_APP_ENV", "local" as const,
 *   z.enum(["local", "staging", "production"]));
 * ```
 */
export function env<T>(key: string, defaultValue: T, schema?: z.ZodType<T>): T {
  const raw = readRawEnv(key);

  if (schema) {
    const candidate: unknown = raw ?? defaultValue;
    const parsed = schema.safeParse(candidate);

    if (parsed.success) {
      return parsed.data;
    }

    // eslint-disable-next-line no-console
    console.error(
      `[env] Invalid value for ${key}: ${JSON.stringify(candidate)}\n` +
        z.prettifyError(parsed.error),
    );
    throw new Error(
      `Invalid environment variable "${key}". Check apps/dashboard/environments/.env`,
    );
  }

  if (raw === undefined) {
    return defaultValue;
  }

  // Auto-coerce based on the shape of the default value.
  switch (typeof defaultValue) {
    case "number": {
      const parsed = Number(raw);

      return (Number.isFinite(parsed) ? parsed : defaultValue) as T;
    }
    case "boolean": {
      return ["true", "1", "yes", "on"].includes(raw.toLowerCase()) as unknown as T;
    }
    default:
      return raw as T;
  }
}

// ---------------------------------------------------------------------------
// Composed config surface: envConfig
// ---------------------------------------------------------------------------

/**
 * Strongly-typed, pre-validated snapshot of every env var the dashboard
 * needs at runtime. Parsed once at module init — any invalid value throws
 * before React mounts, which is the desired boot-time contract.
 *
 * Prefer this over calling {@link env} directly for known keys — the
 * pre-parse cost is paid once and consumers get autocomplete on the shape.
 */
export const envConfig = Object.freeze({
  /** Human-readable product name, used in the shell + document title. */
  appName: env("VITE_APP_NAME", "Academorix", z.string().min(1)),

  /** Deployment tier — drives dev-only conveniences (extra logging, mocks). */
  appEnv: env(
    "VITE_APP_ENV",
    "local" as "local" | "staging" | "production",
    z.enum(["local", "staging", "production"]),
  ),

  /**
   * Dev-mode API origin override. Used only when `resolveHostContext()`
   * cannot derive a same-origin API base (e.g. Vite dev server on
   * `localhost:3000` talking to Laravel on `localhost:8000`). In
   * production the SPA is served from the same origin as the API
   * (`{host}/api/*`) and this value is ignored.
   */
  apiUrl: env("VITE_API_URL", "http://localhost:8000", z.url()),

  /** Base path prefixed to every API call, e.g. `/api`. */
  apiPath: env("VITE_API_PATH", "/api", z.string()),

  /**
   * The **central** host that serves the workspace picker
   * (`academorix.app`). Requests from this host land on the
   * platform-admin auth endpoints when a user signs in as an admin.
   */
  centralHost: env("VITE_CENTRAL_HOST", "academorix.app", z.string().min(1)),

  /**
   * The **platform admin** host (a subdomain of the central host by
   * convention, e.g. `admin.academorix.app`). The `platform.domain`
   * middleware on the backend rejects any request from a tenant
   * subdomain, so the admin surface MUST be served on a central host.
   */
  platformAdminHost: env("VITE_PLATFORM_ADMIN_HOST", "admin.academorix.app", z.string().min(1)),

  /**
   * Absolute origin of the public marketing site (Next.js app at
   * `apps/landing-page`, deployed as its own Vercel project). Used for
   * outbound CTAs from inside the SPA — e.g. Billing → "Change plan"
   * opens `${envConfig.marketingUrl}/pricing`. Falls back to
   * localhost:3001 for local dev so the two apps can run side-by-side.
   */
  marketingUrl: env("VITE_MARKETING_URL", "http://localhost:3001", z.url()),

  /** Reverb (Laravel Echo) config for realtime updates. */
  reverb: Object.freeze({
    appKey: env("VITE_REVERB_APP_KEY", "academorix-local-key", z.string().min(1)),
    host: env("VITE_REVERB_HOST", "localhost", z.string().min(1)),
    port: env("VITE_REVERB_PORT", 8080, z.coerce.number().int().positive()),
    scheme: env("VITE_REVERB_SCHEME", "http" as "http" | "https", z.enum(["http", "https"])),
  }),
} as const);

/** Static type of the {@link envConfig} snapshot. */
export type EnvConfig = typeof envConfig;
