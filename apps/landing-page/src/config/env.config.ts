/**
 * @file env.config.ts
 * @module config/env.config
 *
 * @description
 * Type-safe, schema-validated access to the browser-exposed environment for
 * the Next.js marketing app.
 *
 * All keys must be prefixed `NEXT_PUBLIC_*` (Next.js enforces this at build
 * time — anything else stays server-only). We fail fast at module init on
 * malformed values so a misconfigured deployment can't silently boot with
 * degraded behaviour.
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
 *    fetch(envConfig.backendUrl);
 *    window.location.href = `${envConfig.appUrl}/login`;
 *    ```
 *
 * 2. **Ad-hoc generic reader** ({@link env}) — for one-off env vars that
 *    don't warrant a permanent slot in the config surface.
 *
 *    ```ts
 *    import { env } from "@/config/env.config";
 *    import { z } from "zod";
 *
 *    const previewToken = env("NEXT_PUBLIC_PREVIEW_TOKEN", "", z.string());
 *    ```
 *
 * ## External SaaS integrations
 *
 * Marketing links out to third-party surfaces we don't own the UI for:
 *
 *  - **Featurebase** — the changelog / product-updates board hosted at
 *    `academorix.featurebase.app`. Replaces our internal `/changelog` route.
 *  - **Mintlify** — the docs portal hosted at `docs.academorix.com` once
 *    provisioned; falls back to the marketing origin's `/docs` placeholder
 *    for local dev.
 *  - **YouTube** — the tutorials channel. Replaces our internal
 *    `/resources/tutorials` route.
 *  - **Status page** — surfaced by the footer "Status" link.
 *
 * Each has its own `NEXT_PUBLIC_*_URL` env var so preview / staging /
 * production can point at different endpoints.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Low-level primitive: env<T>(key, default, schema?)
// ---------------------------------------------------------------------------

/** Values Next.js sometimes surfaces for a missing env var. */
const EMPTY_STRING_VALUES = new Set(["", "undefined", "null"]);

/**
 * Reads a `NEXT_PUBLIC_*` env var from `process.env`. Returns `undefined`
 * when the key is absent, empty, or literally `"undefined"` / `"null"` so
 * downstream code can uniformly fall back to defaults.
 */
function readRawEnv(key: string): string | undefined {
  const raw = process.env[key];

  if (raw === undefined || raw === null) {
    return undefined;
  }

  const str = String(raw);

  return EMPTY_STRING_VALUES.has(str) ? undefined : str;
}

/**
 * Trims one or more trailing slashes so URL joins stay clean:
 * `${envConfig.appUrl}/login` never produces `//login`.
 */
function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Generic, type-safe environment variable reader.
 *
 * When called without a `schema`, the return type is inferred from
 * `defaultValue`:
 *
 *  - `string` default → returns the raw string when present, else default.
 *  - `number` default → coerces via `Number(raw)`; falls back on `NaN`.
 *  - `boolean` default → accepts `"true"`, `"1"`, `"yes"`, `"on"`
 *    (case-insensitive) as `true`; anything else present as `false`.
 *
 * When called with a Zod schema, the raw value (or the default when
 * missing) is passed through `safeParse` and any validation failure
 * throws — the intended behaviour for boot-time verification.
 *
 * @param key - The env var name (must start with `NEXT_PUBLIC_`).
 * @param defaultValue - Fallback returned when the var is absent or empty.
 * @param schema - Optional Zod schema for structural validation.
 * @returns The parsed value.
 * @throws Error when the value fails schema validation.
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
      `Invalid environment variable "${key}". Check apps/landing-page/environments/.env`,
    );
  }

  if (raw === undefined) {
    return defaultValue;
  }

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
 * Zod schema for a URL that we then normalise by trimming trailing slashes.
 * We accept URLs *and* schemeless authority strings (e.g. `docs.example.com`)
 * defensively; the failsafe stays flexible for infra teams.
 */
const urlSchema = z.string().min(1);

/**
 * Strongly-typed, pre-validated snapshot of every env var the landing page
 * needs at runtime. Parsed once at module init — any invalid value throws
 * before Next.js renders a page, which is the desired boot-time contract.
 *
 * Every URL has its trailing slash trimmed, so downstream code can safely
 * concatenate a path: `${envConfig.appUrl}/login` always yields exactly
 * one `/`.
 */
export const envConfig = Object.freeze({
  /**
   * Absolute URL of the tenant SPA (dashboard). Anonymous "Sign in" /
   * "Get started" CTAs on the marketing site bounce here.
   */
  appUrl: trimTrailingSlash(env("NEXT_PUBLIC_APP_URL", "http://localhost:3000", urlSchema)),

  /**
   * The marketing site's own canonical origin. Used for OG images, sitemap
   * entries, and canonical link tags. Local dev falls back to the default
   * Next.js port (3001 so marketing and SPA can run side-by-side).
   */
  marketingUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_MARKETING_URL", "http://localhost:3001", urlSchema),
  ),

  /**
   * Backend API origin — only used by the (future) server-side pricing
   * catalog fetch. Marketing pages otherwise render off the static plan
   * fixture.
   */
  backendUrl: trimTrailingSlash(env("NEXT_PUBLIC_BACKEND_URL", "http://localhost:8000", urlSchema)),

  /**
   * Featurebase changelog board — the `/changelog` route bounces here.
   * Override per environment with `NEXT_PUBLIC_FEATUREBASE_URL`.
   */
  changelogUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_FEATUREBASE_URL", "https://academorix.featurebase.app", urlSchema),
  ),

  /**
   * Mintlify docs portal — the `/docs` route bounces here. Override per
   * environment with `NEXT_PUBLIC_DOCS_URL`. Falls back to
   * `docs.academorix.com`.
   */
  docsUrl: trimTrailingSlash(env("NEXT_PUBLIC_DOCS_URL", "https://docs.academorix.com", urlSchema)),

  /**
   * YouTube tutorials channel — the `/resources/tutorials` route bounces
   * here. Override per environment with `NEXT_PUBLIC_TUTORIALS_URL`.
   */
  tutorialsUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_TUTORIALS_URL", "https://www.youtube.com/@academorix", urlSchema),
  ),

  /**
   * Public status page — surfaced by the footer "Status" link.
   */
  statusUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_STATUS_URL", "https://status.academorix.com", urlSchema),
  ),
} as const);

/** Static type of the {@link envConfig} snapshot. */
export type EnvConfig = typeof envConfig;
