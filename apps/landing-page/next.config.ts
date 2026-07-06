/**
 * @file next.config.ts
 * @description
 * Production-grade Next.js 16 configuration for the marketing app.
 *
 * ## What this file wires
 *
 *  - **`typedRoutes: true`** — compile-time typed `Link` hrefs (moved
 *    out of `experimental` in Next 16.2).
 *  - **`experimental.optimizePackageImports`** — tree-shakes the
 *    shared UI barrels (`@academorix/ui`, `@academorix/ui/icons`) so
 *    a `<Button>` import doesn't pull the whole HeroUI Pro barrel.
 *  - **`images.remotePatterns`** — allow-list sourced from
 *    `./config/seo.config` so a single edit in one file lets
 *    `next/image` optimise a new CDN.
 *  - **`compiler.removeConsole`** — strips `console.log` in
 *    production builds (keeps `error` + `warn`).
 *  - **`headers()`** — Strict-Transport-Security, X-Frame-Options,
 *    X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
 *    Content-Security-Policy. Static assets keep their default
 *    Next.js cache headers — overriding `_next/static` breaks HMR
 *    in dev.
 *  - **`redirects()`** — sourced from `./config/routes.config` so
 *    every legacy URL is discoverable in one place.
 *  - **`turbopack.root`** — explicit root so Turbopack doesn't
 *    inherit the entire pnpm workspace root during dev (fixes the
 *    "couldn't find next/package.json" warning on monorepo boot).
 *  - **`@serwist/turbopack`** — Turbopack-native PWA wiring. Since
 *    Next 16 defaults to Turbopack for both `next dev` and `next
 *    build`, we use `@serwist/turbopack`'s Route-Handler-based SW
 *    (see `src/app/serwist/[path]/route.ts`) instead of the classic
 *    `@serwist/next` webpack plugin. The `withSerwist` wrapper here
 *    only ensures Next resolves the SW route correctly; no options.
 *    Client-side registration lives in `src/app/providers.tsx`
 *    via `<SerwistProvider swUrl="/serwist/sw.js" ...>`.
 *
 * ## Why `.ts` instead of `.mjs`
 *
 * Next 15+ supports TypeScript configs natively. We adopted it here
 * so this file can `import` the declarative modules under
 * `./config/*.config.ts` — the single source of truth for the values
 * the Next config consumes (image origins, analytics CSP whitelists,
 * legacy redirects). Every `.config.ts` in `./config/` stays
 * independently importable from runtime code too.
 */

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import bundleAnalyzer from "@next/bundle-analyzer";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

import { ANALYTICS_CSP_ORIGINS } from "./src/config/analytics.config";
import { LEGACY_REDIRECTS } from "./src/config/routes.config";
import { REMOTE_IMAGE_PATTERNS } from "./src/config/seo.config";

import type { NextConfig } from "next";

const __filenameForConfig = fileURLToPath(import.meta.url);
const __dirnameForConfig = dirname(__filenameForConfig);

/**
 * Monorepo (workspace) root — one level up from `apps/landing-page`,
 * up two from this file. In a pnpm workspace the shared
 * `node_modules/.pnpm` store, the sibling workspace packages
 * (`@academorix/ui`), and the tsconfig presets all live at this
 * level, so Turbopack needs to be able to reach up here for
 * resolution to work.
 */
const WORKSPACE_ROOT = dirname(dirname(__dirnameForConfig));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "1",
  openAnalyzer: false,
});

/**
 * `next-intl` build-time plugin. Registers the request-time loader
 * at `./i18n/request.ts` so `getRequestConfig()` resolves the active
 * locale and the matching `messages/{locale}.json` payload for every
 * Server Component render.
 */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Builds the `Content-Security-Policy` header value. Analytics
 * origins are spliced in from `./config/analytics.config.ts` so
 * adding a new provider is a one-file change — the CSP picks it up
 * automatically.
 *
 * ## Directive rationale
 *
 *  - `script-src 'unsafe-inline' 'unsafe-eval'` is required by
 *    Next.js's runtime (hydration bootstraps, refresh boundaries).
 *  - `style-src 'unsafe-inline'` is required by Tailwind v4 +
 *    HeroUI's CSS-in-JS style tags injected at runtime.
 *  - `frame-ancestors 'none'` blocks the site from being iframed —
 *    clickjacking defence, matches `X-Frame-Options: DENY`.
 */
function buildContentSecurityPolicy(): string {
  const scriptOrigins = ANALYTICS_CSP_ORIGINS.script.join(" ");
  const connectOrigins = ANALYTICS_CSP_ORIGINS.connect.join(" ");
  const frameOrigins = ANALYTICS_CSP_ORIGINS.frame.join(" ");
  const imgOrigins = ANALYTICS_CSP_ORIGINS.img.join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${scriptOrigins}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: https://academorix.com https://*.academorix.com ${imgOrigins}`,
    `connect-src 'self' https://api.academorix.com ${connectOrigins}`,
    "media-src 'self'",
    `frame-src 'self' ${frameOrigins}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Shared security headers applied to every response. */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  trailingSlash: false,

  // Compile-time typed `Link` hrefs. Moved out of `experimental` in
  // Next 16.2.
  typedRoutes: true,

  // Ensures Next processes TS/TSX inside our workspace packages
  // during build.
  transpilePackages: ["@academorix/ui", "@academorix/eslint-config"],

  compiler: {
    // Strip console.* in production, keep error + warn.
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  experimental: {
    // Tree-shakes the barrel-heavy HeroUI + icon imports.
    optimizePackageImports: [
      "@academorix/ui",
      "@academorix/ui/react",
      "@academorix/ui/icons",
      "@academorix/ui/icons/outline",
      "@academorix/ui/icons/solid",
      "@academorix/ui/icons/mini",
      "@academorix/ui/icons/micro",
      "@heroui/react",
      "@heroui-pro/react",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Spread into a fresh array so Next's mutation-friendly type is
    // happy with the `readonly` source constant.
    remotePatterns: [...REMOTE_IMAGE_PATTERNS],
  },

  /**
   * Turbopack module resolution root. In a pnpm monorepo we must set
   * this explicitly, otherwise Turbopack walks up looking for
   * `next/package.json` and can fail to locate it through the
   * workspace symlinks. Scoping to the workspace root keeps its file
   * inclusions correct.
   */
  turbopack: {
    root: WORKSPACE_ROOT,
  },

  /**
   * Global response headers. We intentionally do NOT override
   * `Cache-Control` for `_next/static/:path*` — Next.js already sets
   * those correctly for production and a custom override breaks HMR
   * in dev.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      // OG images can be re-fetched hourly.
      {
        source: "/opengraph-image",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" }],
      },
    ];
  },

  /**
   * Permanent redirects for legacy or shortened paths. Sourced from
   * `./config/routes.config.ts` so every legacy URL is discoverable
   * in one place.
   */
  async redirects() {
    return LEGACY_REDIRECTS.map((redirect) => ({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent,
    }));
  },
};

export default withSerwist(withBundleAnalyzer(withNextIntl(nextConfig)));
