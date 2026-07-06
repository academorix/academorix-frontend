/**
 * @file env.ts
 * @module config/env
 *
 * @description
 * Schema-validated, browser-exposed environment. All keys must be prefixed
 * `VITE_*` (Vite enforces this at build time). We fail fast at startup on any
 * malformed value so a misconfigured deployment does not silently boot with
 * degraded behaviour.
 *
 * The alignment plan (see `.kiro/specs/backend-frontend-alignment/PLAN.md`)
 * introduces a **host-aware** runtime: the SPA lives at `academorix.app`
 * (workspace picker), `admin.academorix.app` (platform admin surface) and
 * `{slug}.academorix.app` (tenant subdomains + custom domains). This module
 * exposes the raw values; `@/lib/http/host` derives the active host context.
 */

import { z } from "zod";

const envSchema = z.object({
  /** Human-readable product name, used in the shell + document title. */
  VITE_APP_NAME: z.string().min(1).default("Academorix"),

  /** Deployment tier — drives dev-only conveniences (extra logging, mocks). */
  VITE_APP_ENV: z.enum(["local", "staging", "production"]).default("local"),

  /**
   * Dev-mode API origin override. Used only when `resolveHostContext()` cannot
   * derive a same-origin API base (e.g. Vite dev server on `localhost:3000`
   * talking to Laravel on `localhost:8000`). In production the SPA is served
   * from the same origin as the API (`{host}/api/*`) and this value is ignored.
   */
  VITE_API_URL: z.url().default("http://localhost:8000"),

  /** Base path prefixed to every API call, e.g. `/api`. */
  VITE_API_PATH: z.string().default("/api"),

  /**
   * The **central** host that serves the workspace picker (`academorix.app`).
   * Requests from this host land on the platform-admin auth endpoints when a
   * user signs in as an admin.
   */
  VITE_CENTRAL_HOST: z.string().min(1).default("academorix.app"),

  /**
   * The **platform admin** host (a subdomain of the central host by convention,
   * e.g. `admin.academorix.app`). The `platform.domain` middleware on the
   * backend rejects any request from a tenant subdomain, so the admin surface
   * MUST be served on a central host.
   */
  VITE_PLATFORM_ADMIN_HOST: z.string().min(1).default("admin.academorix.app"),

  /**
   * Absolute origin of the public marketing site (Next.js app at
   * `apps/landing-page`, deployed as its own Vercel project). Used for
   * outbound CTAs from inside the SPA — e.g. Billing → "Change plan" opens
   * `${VITE_MARKETING_URL}/pricing`. Falls back to localhost:3001 for local
   * dev so the two apps can run side-by-side.
   */
  VITE_MARKETING_URL: z.url().default("http://localhost:3001"),

  /** Reverb (Laravel Echo) config for realtime updates. */
  VITE_REVERB_APP_KEY: z.string().min(1).default("academorix-local-key"),
  VITE_REVERB_HOST: z.string().min(1).default("localhost"),
  VITE_REVERB_PORT: z.coerce.number().int().positive().default(8080),
  VITE_REVERB_SCHEME: z.enum(["http", "https"]).default("http"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid frontend environment variables:\n", z.prettifyError(parsed.error));

  throw new Error("Invalid environment variables. Check apps/web/environments/.env");
}

export const env: Env = parsed.data;
