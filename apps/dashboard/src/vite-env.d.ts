/**
 * @file vite-env.d.ts
 * @module vite-env
 *
 * @description
 * Ambient type declarations that shape TypeScript's view of every non-code
 * asset the Vite bundler exposes at build time. Sits at the top of the
 * `src/` tree so `include: ["src"]` in tsconfig picks it up automatically.
 *
 * Sections:
 *   1. Vite core client types (`ImportMeta.env`, `?url`/`?raw` imports, etc.).
 *   2. `vite-plugin-pwa` virtual modules (`virtual:pwa-register/react` +
 *      companions) — needed for `src/pwa/register-sw.ts` to typecheck.
 *   3. Application env schema — the `VITE_*` variables our runtime accepts
 *      (mirrored + validated at runtime in `src/config/env.ts`).
 *   4. Build-time `define` globals injected by `vite.config.ts`.
 *
 * Whenever a new env var lands in `src/config/env.ts` or a new global is
 * added to `vite.config.ts` → `define`, update this file too or TypeScript
 * will start yelling about implicit `any`.
 */

// ---------------------------------------------------------------------------
// 1. Vite core client types
// ---------------------------------------------------------------------------
// Registers `import.meta.env.MODE`, `import.meta.env.PROD`, `?url`, `?raw`,
// `?worker` and every other Vite-flavoured import suffix. Without this, TS
// complains about the branch in `providers.tsx` that reads `import.meta.env.PROD`.
/// <reference types="vite/client" />

// ---------------------------------------------------------------------------
// 2. vite-plugin-pwa virtual modules
// ---------------------------------------------------------------------------
// The plugin injects a set of "virtual" modules that only resolve at build
// time. These triple-slash references pull in their `.d.ts` files so TS can
// resolve imports like:
//
//   import { useRegisterSW } from "virtual:pwa-register/react";
//
// Reference: https://vite-pwa-org.netlify.app/frameworks/react
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/info" />

// ---------------------------------------------------------------------------
// 3. Application env schema
// ---------------------------------------------------------------------------
/**
 * Compile-time contract for the `VITE_*` environment variables our SPA
 * consumes. This is a design-time convenience — the *authoritative* source
 * remains `src/config/env.ts`, which uses Zod to validate at boot and fails
 * fast on missing/malformed values.
 *
 * Whenever you edit this interface, update `envSchema` in `env.ts` in the
 * same commit so runtime + types stay in lock-step.
 */
interface ImportMetaEnv {
  /** Human-readable product name. Rendered in the shell + document title. */
  readonly VITE_APP_NAME: string;

  /** Deployment tier — flips dev-only conveniences. */
  readonly VITE_APP_ENV: "local" | "staging" | "production";

  /** Dev-mode API origin override; ignored in same-origin production. */
  readonly VITE_API_URL: string;

  /** Base path prefixed to every API call, e.g. `/api`. */
  readonly VITE_API_PATH: string;

  /** Central host that serves the workspace picker (e.g. `academorix.app`). */
  readonly VITE_CENTRAL_HOST: string;

  /** Platform-admin host (e.g. `admin.academorix.app`). */
  readonly VITE_PLATFORM_ADMIN_HOST: string;

  /** Absolute origin of the marketing site (public CTAs link here). */
  readonly VITE_MARKETING_URL: string;

  /** Reverb (Laravel Echo) — realtime updates. */
  readonly VITE_REVERB_APP_KEY: string;
  readonly VITE_REVERB_HOST: string;
  readonly VITE_REVERB_PORT: string;
  readonly VITE_REVERB_SCHEME: "http" | "https";
}

/**
 * Overrides the default `ImportMeta` shape from `vite/client` so
 * `import.meta.env.VITE_APP_NAME` (etc.) is typed instead of `any`.
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ---------------------------------------------------------------------------
// 4. Build-time `define` globals
// ---------------------------------------------------------------------------
// Injected by `vite.config.ts` → `define`. TypeScript needs to know about
// them or every reference site errors with "Cannot find name '__…'".
//
// These are string literals baked into the bundle at build time — the string
// content is replaced verbatim, so the values below must match what
// `vite.config.ts` writes.

/**
 * Package version at build time (`apps/dashboard/package.json.version`).
 * Used by `src/lib/http/device.ts` to send `X-Client: academorix-web/<v>`
 * on every request, and by the PWA update toast to show the build number.
 */
declare const __ACADEMORIX_VERSION__: string;
