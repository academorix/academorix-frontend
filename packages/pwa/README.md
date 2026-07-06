# @academorix/pwa

PWA + web-security build helpers for the Academorix workspace. Zero runtime deps
— safe to import from `vite.config.ts` and `next.config.ts`.

Depends only on `@academorix/core`.

## Public API

| Subpath                    | Exports                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@academorix/pwa/manifest` | `buildManifest(input)`, `WebAppManifest`, `ManifestIcon`, `ManifestShortcut`, `ManifestTranslation`   |
| `@academorix/pwa/workbox`  | `getRuntimeCaching(options)`, `RuntimeCachingRule`                                                    |
| `@academorix/pwa/security` | `buildContentSecurityPolicy`, `getSecurityHeaders`, `DEFAULT_CSP_INPUT`, `DEFAULT_PERMISSIONS_POLICY` |
| `@academorix/pwa/vite`     | `getVitePwaOptions(input)` for `vite-plugin-pwa`                                                      |
| `@academorix/pwa/serwist`  | `getSerwistOptions(input)` for Serwist                                                                |

Root barrel re-exports everything.

## Design principles

- **Zero peer deps.** The package doesn't depend on `vite-plugin-pwa` or
  `serwist` — apps install those themselves. Our adapters emit plain option
  objects the consumers cast to the right type at the call site. That avoids
  pulling ~10 MB of peer-dep types into every consumer's typecheck.
- **Locale-aware manifest.** `buildManifest` composes the W3C-draft
  `translations` block for locales other than the primary — so installed PWAs
  render in the user's language on supported OSs.
- **Shared security baseline.** Both apps' `vercel.json` / middleware read the
  same CSP + security-headers builder, so bumping HSTS or tightening the CSP
  updates every deploy target in one place.

## Usage

### Dashboard (Vite)

```ts
// apps/dashboard/src/config/pwa.config.ts
import { getVitePwaOptions } from "@academorix/pwa/vite";

import { LOCALE_BCP47_TAGS } from "@/config/i18n.config";

export const MANIFEST_ICONS = [
  { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png", purpose: "any" },
  {
    src: "/pwa-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/pwa-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/apple-touch-icon.png",
    sizes: "180x180",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/maskable-icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

export const PWA_PLUGIN_OPTIONS = getVitePwaOptions({
  manifest: {
    name: "Academorix",
    shortName: "Academorix",
    description: "The operating system for modern academies.",
    lang: LOCALE_BCP47_TAGS.en,
    themeColor: "#0EA5E9",
    backgroundColor: "#FFFFFF",
    icons: MANIFEST_ICONS,
    shortcuts: [/* ... */],
    translations: {
      "ar-EG": {
        name: "أكاديمُريكس",
        short_name: "أكاديمُريكس",
        description: "…",
      },
    },
  },
});

// apps/dashboard/vite.config.ts
import { VitePWA } from "vite-plugin-pwa";
import type { VitePWAOptions } from "vite-plugin-pwa";
import { PWA_PLUGIN_OPTIONS } from "./src/config/pwa.config";

export default defineConfig({
  plugins: [react(), VitePWA(PWA_PLUGIN_OPTIONS as Partial<VitePWAOptions>)],
});
```

### Landing page (Next.js + Serwist)

```ts
// apps/landing-page/src/app/sw.ts
import type { PrecacheEntry } from "@serwist/turbopack";
import { installSerwist } from "@serwist/turbopack";
import { getSerwistOptions } from "@academorix/pwa/serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: PrecacheEntry[];
};

installSerwist({
  ...getSerwistOptions({ runtimeCaching: { includeApi: false } }),
  precacheEntries: self.__SW_MANIFEST,
});
```

### CSP + security headers

```ts
// apps/dashboard — vercel.json headers builder (Node script)
import { getSecurityHeaders } from "@academorix/pwa/security";
import fs from "node:fs";

const headers = Object.entries(
  getSecurityHeaders({
    csp: {
      connectSrc: [
        "'self'",
        "https://api.academorix.app",
        "wss://reverb.academorix.app",
        "https://us.i.posthog.com",
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://vercel.live"],
    },
  }),
).map(([key, value]) => ({ key, value }));

fs.writeFileSync(
  "vercel.json",
  JSON.stringify(
    {
      /* ... */
      headers: [{ source: "/(.*)", headers }],
    },
    null,
    2,
  ),
);
```
