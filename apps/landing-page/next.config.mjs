/**
 * @file next.config.mjs
 * @description
 * Production-grade Next.js 16 configuration for the marketing app.
 *
 * ## What this file wires
 *
 *  - **`typedRoutes: true`** — compile-time typed `Link` hrefs (moved out of
 *    `experimental` in Next 16.2).
 *  - **`experimental.optimizePackageImports`** — tree-shakes the shared UI
 *    barrels (`@academorix/ui`, `@academorix/ui/icons`) so a `<Button>`
 *    import doesn't pull the whole HeroUI Pro barrel.
 *  - **`images.remotePatterns`** — allow-list for OG assets, blog images,
 *    and Academorix's CDN.
 *  - **`compiler.removeConsole`** — strips `console.log` in production
 *    builds (keeps `error` + `warn`).
 *  - **`headers()`** — Strict-Transport-Security, X-Frame-Options,
 *    X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
 *    Content-Security-Policy. Static assets get their default Next.js
 *    cache headers (we do NOT override `_next/static` — Next handles it and
 *    a custom override breaks HMR in dev).
 *  - **`redirects()`** — legacy path shortcuts.
 *  - **`turbopack.root`** — explicit root so Turbopack doesn't inherit the
 *    entire pnpm workspace root during dev (fixes the "couldn't find
 *    next/package.json" warning on monorepo boot).
 *
 * ## Notes
 *
 *  - Runs on Vercel out of the box — no `output: "standalone"` needed.
 *  - The CSP is intentionally strict but includes `'unsafe-inline'` for
 *    styles (HeroUI + Tailwind v4 inject inline `<style>` tags at runtime
 *    for critical CSS). Scripts are locked to `'self'` + Vercel Analytics.
 *  - The bundle analyzer is wired via `@next/bundle-analyzer` — set
 *    `ANALYZE=1` at build time to open the report.
 */

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Monorepo (workspace) root — one level up from `apps/landing-page`, up two
 * from this file. In a pnpm workspace the shared `node_modules/.pnpm` store,
 * the sibling workspace packages (`@academorix/ui`), and the tsconfig
 * presets all live at this level, so Turbopack needs to be able to reach
 * up here for resolution to work.
 */
const WORKSPACE_ROOT = dirname(dirname(__dirname));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "1",
  openAnalyzer: false,
});

/**
 * `next-intl` build-time plugin. Registers the request-time loader at
 * `./i18n/request.ts` so `getRequestConfig()` resolves the active locale
 * and the matching `messages/{locale}.json` payload for every Server
 * Component render.
 */
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Shared security headers applied to every response.
 */
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
    value: [
      "default-src 'self'",
      // Scripts: self + Vercel Analytics + inline for Next.js runtime hydration.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://vercel.live",
      // Styles: self + inline for Tailwind v4 + HeroUI CSS-in-JS style tags.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts (used by next/font).
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images: self + data: + allowed CDNs for OG + testimonial avatars.
      "img-src 'self' data: blob: https://academorix.com https://*.academorix.com https://vercel.live",
      // XHR/fetch: self + our backend API + Vercel infra.
      "connect-src 'self' https://api.academorix.com https://*.vercel-scripts.com https://vercel.live",
      "media-src 'self'",
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  trailingSlash: false,

  // Compile-time typed `Link` hrefs. Moved out of `experimental` in Next 16.2.
  typedRoutes: true,

  // Ensures Next processes TS/TSX inside our workspace packages during build.
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
    remotePatterns: [
      { protocol: "https", hostname: "academorix.com" },
      { protocol: "https", hostname: "**.academorix.com" },
      { protocol: "https", hostname: "academorix.app" },
      { protocol: "https", hostname: "**.academorix.app" },
      { protocol: "https", hostname: "heroui-assets.nyc3.cdn.digitaloceanspaces.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  /**
   * Turbopack module resolution root. In a pnpm monorepo we must set this
   * explicitly, otherwise Turbopack walks up looking for `next/package.json`
   * and can fail to locate it through the workspace symlinks. Scoping to
   * this app directory keeps its file inclusions tight.
   */
  turbopack: {
    root: WORKSPACE_ROOT,
  },

  /**
   * Global response headers. We intentionally do NOT override
   * `Cache-Control` for `_next/static/:path*` — Next.js already sets those
   * correctly for production and a custom override breaks HMR in dev.
   *
   * @returns {Promise<import("next").NextConfig["headers"] extends (() => Promise<infer T>) ? T : never>}
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
   * Permanent redirects for legacy or shortened paths.
   *
   * @returns {Promise<import("next").NextConfig["redirects"] extends (() => Promise<infer T>) ? T : never>}
   */
  async redirects() {
    return [
      { source: "/help", destination: "/docs", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
