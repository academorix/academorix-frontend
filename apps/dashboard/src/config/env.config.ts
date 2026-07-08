/**
 * @file env.config.ts
 * @module config/env.config
 *
 * @description
 * Type-safe, schema-validated access to the dashboard's browser-exposed
 * environment. Composes {@link "@academorix/core/env"}'s `createEnvReader`
 * (the shared workspace primitive) with a Vite-specific `read` closure that
 * lets Vite substitute `import.meta.env.VITE_*` at build time.
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
 *    don't warrant a permanent slot in the config surface.
 *
 * ## Host-aware runtime
 *
 * The alignment plan (see `.kiro/specs/backend-frontend-alignment/PLAN.md`)
 * introduces a **host-aware** runtime: the SPA lives at `academorix.app`
 * (workspace picker), `admin.academorix.app` (platform admin surface) and
 * `{slug}.academorix.app` (tenant subdomains + custom domains). This module
 * exposes the raw values; `@/lib/http/host` derives the active host context.
 */

import { createEnvReader } from "@academorix/core/env";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Env reader — bound to Vite's `import.meta.env` at build time.
// ---------------------------------------------------------------------------

/**
 * Generic, type-safe environment variable reader. Wraps
 * `createEnvReader` from `@academorix/core/env` with a closure over
 * `import.meta.env` — the closure LIVES in this file so Vite can
 * substitute the values at build time (the substitution only happens
 * inside the caller's compilation unit, not inside a package).
 *
 * See `@academorix/core/env` for the full contract.
 *
 * @example
 * ```ts
 * const port = env("VITE_PORT", 3000);              // number
 * const host = env("VITE_HOST", "localhost");       // string
 * const debug = env("VITE_DEBUG", false);           // boolean
 * const tier = env("VITE_APP_ENV", "local" as const,
 *   z.enum(["local", "staging", "production"]));
 * ```
 */
export const env = createEnvReader((key) => (import.meta.env as Record<string, unknown>)[key]);

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

  /**
   * Web Push VAPID public key (base64url encoded). Used to identify the
   * application server when subscribing to push notifications.
   *
   * When empty, the push registration flow first attempts
   * `GET /api/v1/config/vapid` (also currently a backend gap — see
   * notifications module); this variable is the deploy-time
   * fallback. One of the two paths MUST resolve to a key before push
   * registration can succeed. An empty string at boot is acceptable
   * because the `webPush` feature flag is defaulted OFF (see
   * `features.config.ts`) — the whole surface stays dark until an
   * environment ships the key + flips the flag.
   *
   * Kept as a plain string (not `.min(1)`) so the app boots without
   * a key configured; `fetchVapidPublicKey` surfaces a specific error
   * when the value is actually consumed.
   */
  vapidPublicKey: env("VITE_VAPID_PUBLIC_KEY", "", z.string()),
} as const);

/** Static type of the {@link envConfig} snapshot. */
export type EnvConfig = typeof envConfig;
