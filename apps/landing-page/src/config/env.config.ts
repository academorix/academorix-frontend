/**
 * @file env.config.ts
 * @module config/env.config
 *
 * @description
 * Type-safe, schema-validated access to the marketing app's
 * browser-exposed environment. Composes
 * {@link "@academorix/core/env"}'s `createEnvReader` (the shared
 * workspace primitive) with a Next.js-specific `read` closure over
 * `process.env` so build-time substitution works.
 *
 * All keys must be prefixed `NEXT_PUBLIC_*` (Next.js enforces this at
 * build time — anything else stays server-only). We fail fast at
 * module init on malformed values so a misconfigured deployment can't
 * silently boot with degraded behaviour.
 *
 * ## API
 *
 * 1. **Pre-parsed config object** ({@link envConfig}) — the common case.
 * 2. **Ad-hoc generic reader** ({@link env}) — for one-off vars.
 *
 * ## External SaaS integrations
 *
 *  - **Featurebase** — changelog board at `academorix.featurebase.app`.
 *  - **Mintlify** — docs portal at `docs.academorix.com`.
 *  - **YouTube** — tutorials channel.
 *  - **Status page** — footer "Status" link.
 *
 * Each has its own `NEXT_PUBLIC_*_URL` env so preview / staging /
 * production can point at different endpoints.
 */

import { createEnvReader } from "@academorix/core/env";
import { trimTrailingSlash } from "@academorix/core/utils";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Env reader — bound to Next.js's `process.env` at build time.
// ---------------------------------------------------------------------------

/**
 * Generic, type-safe environment variable reader. Wraps
 * `createEnvReader` from `@academorix/core/env` with a closure over
 * `process.env` so Next.js can substitute `NEXT_PUBLIC_*` values at
 * build time — the substitution only happens inside the caller's
 * compilation unit, not inside a package.
 *
 * See `@academorix/core/env` for the full contract.
 */
export const env = createEnvReader((key) => process.env[key]);

// ---------------------------------------------------------------------------
// Composed config surface: envConfig
// ---------------------------------------------------------------------------

/**
 * Zod schema for a URL — schemeless authority strings are accepted
 * defensively so ops can point env vars at `docs.example.com` without
 * requiring the protocol.
 */
const urlSchema = z.string().min(1);

/**
 * Strongly-typed, pre-validated snapshot of every env var the landing
 * page needs at runtime. Parsed once at module init — any invalid
 * value throws before Next.js renders a page.
 *
 * Every URL has its trailing slash trimmed, so downstream code can
 * safely concatenate a path: `${envConfig.appUrl}/login` always yields
 * exactly one `/`.
 */
export const envConfig = Object.freeze({
  /**
   * Absolute URL of the tenant SPA (dashboard). Anonymous "Sign in" /
   * "Get started" CTAs on the marketing site bounce here.
   */
  appUrl: trimTrailingSlash(env("NEXT_PUBLIC_APP_URL", "http://localhost:3000", urlSchema)),

  /**
   * The marketing site's own canonical origin. Used for OG images,
   * sitemap entries, and canonical link tags.
   */
  marketingUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_MARKETING_URL", "http://localhost:3001", urlSchema),
  ),

  /**
   * Backend API origin — used by the (future) server-side pricing
   * catalog fetch.
   */
  backendUrl: trimTrailingSlash(env("NEXT_PUBLIC_BACKEND_URL", "http://localhost:8000", urlSchema)),

  /** Featurebase changelog board. */
  changelogUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_FEATUREBASE_URL", "https://academorix.featurebase.app", urlSchema),
  ),

  /** Mintlify docs portal. */
  docsUrl: trimTrailingSlash(env("NEXT_PUBLIC_DOCS_URL", "https://docs.academorix.com", urlSchema)),

  /** YouTube tutorials channel. */
  tutorialsUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_TUTORIALS_URL", "https://www.youtube.com/@academorix", urlSchema),
  ),

  /** Public status page. */
  statusUrl: trimTrailingSlash(
    env("NEXT_PUBLIC_STATUS_URL", "https://status.academorix.com", urlSchema),
  ),
} as const);

/** Static type of the {@link envConfig} snapshot. */
export type EnvConfig = typeof envConfig;
