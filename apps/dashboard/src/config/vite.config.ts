/**
 * @file vite.config.ts
 * @module @academorix/dashboard/config/vite
 * @description Vite plugin registry for the dashboard.
 *
 *   Consumes `@stackra/vite`'s `{ enabled, factory, options }`
 *   envelope for every plugin. The root `vite.config.ts` feeds this
 *   registry into `defineConfig(...)` from `@stackra/vite`, which
 *   walks the map, invokes each enabled entry's `factory(options)`,
 *   flattens the results into a `Plugin[]` array, deep-merges the
 *   workspace defaults under any additional Vite options declared
 *   below, and returns a Vite config factory.
 *
 *   The order of keys in `plugins` determines the order plugins run
 *   in — `@stackra/vite`'s `resolvePlugins(...)` preserves insertion
 *   order. Toggling a plugin flips its `enabled` flag; the factory
 *   is only invoked when `enabled === true`, so a disabled entry
 *   never installs its plugin or evaluates its options.
 *
 *   NOTE ON THE NAME: this file lives at `src/config/vite.config.ts`
 *   which shares its basename with the project-root
 *   `vite.config.ts`. That is intentional — matches the workspace
 *   `<name>.config.ts` template pattern. The two files never
 *   collide because Vite only ever loads the root one; this one is
 *   a plain module the root imports.
 */

import tailwindcss from "@tailwindcss/vite";
import type { IViteConfigOptions } from "@stackra/vite";
import { router } from "@stackra/routing/vite";
import react from "@vitejs/plugin-react-swc";

import vitePluginPreviewAnnotations from "../../plugins/vite-plugin-preview-annotations";

/**
 * Vite plugin registry + non-plugin Vite options for the dashboard.
 *
 * Ordering rationale (matches `resolvePlugins(...)` insertion order):
 *
 *   1. `previewAnnotations` — MUST run first. It uses Babel to
 *      rewrite JSX with `data-locator` attributes for the HeroUI Pro
 *      preview iframe + hydrate theme state from the workbench.
 *      Runs before SWC so the transform sees the source shape.
 *   2. `react` — SWC transform + React fast-refresh. `tsDecorators`
 *      unlocks legacy TS decorators + emit-metadata so SWC accepts
 *      `@Injectable()` / `@Inject()` / `@Module()` from
 *      `@stackra/container`. The type-checker gets the same flags
 *      via `@academorix/config-tsconfig`.
 *   3. `tailwind` — Tailwind v4 CSS processing.
 *   4. `router` — `@stackra/routing/vite` plugin. Owns the dev
 *      subdomain middleware, the startup banner, the
 *      `virtual:stackra-routing/dev-subdomain` module, and the
 *      build-time prerender pipeline that walks
 *      `react-router.config.ts` and writes static HTML shells for
 *      SEO. Replaces the removed `stackraSsr()` plugin from Phase G.
 */
export const viteConfig: IViteConfigOptions = {
  plugins: {
    /*
    |------------------------------------------------------------------
    | `vitePluginPreviewAnnotations` — apps/dashboard/plugins/
    |------------------------------------------------------------------
    |
    | Injects `data-locator` attributes for the HeroUI Pro preview
    | runtime + hydrates theme state from the workbench iframe.
    | Local to this app; takes no options.
    |
    */
    previewAnnotations: {
      enabled: true,
      factory: vitePluginPreviewAnnotations,
      options: {},
    },

    /*
    |------------------------------------------------------------------
    | `react` — @vitejs/plugin-react-swc
    |------------------------------------------------------------------
    |
    | Fast-refresh + SWC transform for React. `tsDecorators` enables
    | legacy TS decorators + emit-metadata so SWC accepts the
    | `@Injectable()` / `@Inject()` / `@Module()` decorators used by
    | `@stackra/container`.
    |
    */
    react: {
      enabled: true,
      factory: react,
      options: { tsDecorators: true },
    },

    /*
    |------------------------------------------------------------------
    | `tailwind` — @tailwindcss/vite
    |------------------------------------------------------------------
    |
    | Tailwind v4 Vite plugin. Takes no options today — kept as an
    | entry for symmetry so the `enabled` toggle exists.
    |
    */
    tailwind: {
      enabled: true,
      factory: tailwindcss,
      options: {},
    },

    /*
    |------------------------------------------------------------------
    | `router` — @stackra/routing/vite
    |------------------------------------------------------------------
    |
    | Dev middleware + build-time prerender for the SPA. Replaces the
    | Phase G `stackraSsr()` plugin. Feeds off `react-router.config.ts`
    | at build time to walk every route module and emit prerendered
    | HTML shells for SEO; at dev time it wires the subdomain
    | detection middleware + prints the startup banner.
    |
    | `moduleFile` points at `src/app.module.ts` so the prerender
    | pipeline can bootstrap a build-time DI container for any
    | loader that needs container-scoped services (config, CMS
    | client, feature flags).
    |
    */
    router: {
      enabled: true,
      // Wrap the imported factory in a lambda so TypeScript re-infers
      // the signature at the entry-declaration site. The raw
      // `router` export types its `options` as `options?:
      // IRouterPluginOptions` (parameter is optional), which under
      // `strictFunctionTypes` is not assignable to `IPluginEntry`'s
      // required-parameter shape `(options: TOptions) => …`.
      // Wrapping erases the optional-ness and matches cleanly.
      factory: (options) => router(options),
      options: {
        /*
        |--------------------------------------------------------------
        | rootDomain
        |--------------------------------------------------------------
        |
        | Suffix stripped from every incoming Host header to derive
        | the effective subdomain. Any route that opts into
        | `match.subdomain` in its `defineRoute({...})` participates
        | in this resolution. MUST match `RoutingModule.forRoot(...)`
        | in `src/app.module.ts` — the plugin (dev) and the module
        | (runtime) walk the same set.
        |
        */
        rootDomain: "academorix.app",

        /*
        |--------------------------------------------------------------
        | devMode
        |--------------------------------------------------------------
        |
        | Local subdomain-simulation strategy.
        |
        |   - `'localhost'` — `*.localhost` wildcarding. Every modern
        |     browser resolves `<anything>.localhost` to 127.0.0.1
        |     with no OS setup. Zero-friction default.
        |   - `'hosts-file'` — real subdomains under `rootDomain`.
        |     Required when SAML/OAuth callbacks reject `.localhost`
        |     or when cookie-domain tests need a genuine parent domain.
        |     Run `pnpm stackra dev-hosts` first to seed `/etc/hosts`.
        |   - `'proxy'` — a reverse proxy (Caddy, Nginx, Traefik)
        |     handles the routing upstream of the Vite dev server.
        |
        */
        devMode: "localhost",

        /*
        |--------------------------------------------------------------
        | devSubdomains
        |--------------------------------------------------------------
        |
        | Cosmetic list printed by the router plugin's startup banner
        | so devs know which subdomains are reachable. The actual
        | matcher list comes from the route tree in
        | `react-router.config.ts` — this is documentation only.
        |
        | Kept short + human-readable; every entry is a subdomain
        | the app services today OR is reserved for near-term features.
        |
        */
        devSubdomains: [
          // Marketing / landing surface — served from apps/landing-page in
          // production. Listed here so devs know the reserved slot exists.
          "www",
          // Documentation site.
          "docs",
          // Central-admin / Academorix staff surface.
          "admin",
          // Sample tenant workspaces for local development.
          "acme",
          "test",
        ],

        /*
        |--------------------------------------------------------------
        | allowDevSubdomainQuery
        |--------------------------------------------------------------
        |
        | When `true`, dev requests may override the parsed subdomain
        | via a `?_subdomain=admin` query param — useful for testing
        | subdomain-scoped routes without touching `/etc/hosts` or
        | reconfiguring the browser. Ignored in production builds; the
        | plugin only wires the query hook in `serve` mode.
        |
        */
        allowDevSubdomainQuery: true,

        /*
        |--------------------------------------------------------------
        | configFile
        |--------------------------------------------------------------
        |
        | Path to `react-router.config.ts` — the file that
        | `defineRouterConfig({...})` produces the build-time route
        | tree. Resolved relative to the Vite root. The prerender
        | walk imports this to discover every route the plugin should
        | emit an HTML shell for.
        |
        */
        configFile: "./react-router.config.ts",

        /*
        |--------------------------------------------------------------
        | moduleFile
        |--------------------------------------------------------------
        |
        | Path to the app's DI root module — the prerender pipeline
        | dynamically imports it to bootstrap a build-time DI
        | container. Every route loader that reaches for a container-
        | scoped service (config, CMS client, feature flags) resolves
        | through THIS container at build time.
        |
        */
        moduleFile: "src/app.module.ts",

        /*
        |--------------------------------------------------------------
        | prerender
        |--------------------------------------------------------------
        |
        | Build-time prerender walk — emits static HTML shells for
        | every SEO-relevant route so crawlers see meaningful markup
        | on first byte.
        |
        | ## Status: OFF pending TSX loader
        |
        | TODO(phase-i): re-enable once the plugin's build-time
        | `import()` can resolve `.tsx` extensions + React JSX inside
        | `react-router.config.ts`. Today the loader uses raw Node
        | `import(pathToFileURL(...))` which chokes on the JSX/TS the
        | config file transitively pulls in through `./src/router`.
        | Turning this off keeps the SPA build green; Phase H's
        | routing connectivity is achieved without prerender output,
        | and the prerender pipeline lands as a follow-up.
        |
        | When re-enabled, uncomment `outputDir` to keep prerendered
        | HTML in `dist/prerender/` so the Vercel routing config can
        | serve them via rewrites without colliding with the SPA's
        | asset hash paths.
        |
        */
        prerender: {
          enabled: false,
          // outputDir: 'prerender',
        },
      },
    },
  },

  /*
  |--------------------------------------------------------------------------
  | optimizeDeps
  |--------------------------------------------------------------------------
  |
  | Force-include HeroUI + Iconify + react-aria-components in Vite's dep
  | pre-bundle. These packages are large + heavily re-exported, so pre-
  | bundling them up-front keeps cold-start reasonable and avoids Vite
  | discovering new deps mid-navigation (which would cause a full-page
  | reload).
  |
  | ## Why `react-aria-components` + `use-sync-external-store/shim`
  |
  | `react-aria-components` (transitive dep of `@heroui/react`) imports
  | `use-sync-external-store/shim`, which is a CJS module whose bundled
  | development build contains a `require("react")` call. Vite's dep
  | optimiser turns CJS into ESM at pre-bundle time and resolves that
  | `require` to the correct React reference; without pre-bundling, the
  | shim gets served as raw CJS at runtime and the `__require` polyfill
  | throws `Dynamic require of "react" is not supported`. Explicitly
  | listing the shim's ESM subpaths guarantees they land in the pre-
  | bundle even when the auto-detector misses them.
  |
  */
  optimizeDeps: {
    // Explicit `include` list — every entry MUST resolve from the app's
    // node_modules root (Vite errors on unresolvable entries).
    //
    // Vite crawls each included package's dependency graph and pre-
    // bundles every transitive module it finds — so adding
    // `react-aria-components` here transitively catches
    // `use-sync-external-store` (the CJS shim whose bundled
    // `require("react")` would otherwise crash at runtime with
    // "Dynamic require of \"react\" is not supported"). We do NOT list
    // pnpm-hoisted transitive deps like `@react-aria/utils` or
    // `use-sync-external-store` directly — those are unresolvable from
    // the app root; Vite reaches them through the crawl.
    include: [
      // HeroUI OSS + Pro — heavy, deep re-export trees.
      "@heroui/react",
      "@heroui-pro/react",
      // Iconify — dynamic imports of icon collections rely on pre-bundling.
      "@iconify/react",
      // React Aria (HeroUI's foundation). Crawling this catches the
      // whole `@react-aria/*` + `@react-stately/*` +
      // `use-sync-external-store/*` transitive graph.
      "react-aria-components",
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | server
  |--------------------------------------------------------------------------
  |
  | `allowedHosts: true` lets any Host header through — required for
  | remote dev environments (Codespaces, ngrok tunnels, VM previews)
  | that hit the dev server on non-localhost URLs. Bind to 0.0.0.0
  | for the same reason. Port 3000 matches the workspace convention.
  |
  */
  server: {
    allowedHosts: true,
    host: "0.0.0.0",
    port: 3000,
  },
};
