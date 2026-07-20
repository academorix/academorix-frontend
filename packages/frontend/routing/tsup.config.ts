import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    matchers: "src/matchers/index.ts",
    seo: "src/seo/index.ts",
    testing: "src/testing/index.ts",
    vite: "src/vite/index.ts",
    console: "src/console/index.ts",
  },
  {
    // ── Externals ───────────────────────────────────────────────
    //
    // tsup's `defineBaseConfig` auto-externalises entries in
    // `dependencies` + `peerDependencies`, but three classes of imports
    // still slip through and MUST be listed explicitly here:
    //
    //   1. `vite`, `react-dom/server` — Node-only imports the `./vite`
    //      subpath dynamically requires at build/prerender time.
    //   2. `react-router` — subpath-imported in a few places; listing
    //      the bare name mirrors the peerDep and covers every subpath.
    //   3. `@stackra/ui` (and subpaths) — the framework fallback
    //      components (`DefaultLoadingFallback`, `DefaultEmptyFallback`,
    //      …) import from `@stackra/ui/react` + `@stackra/ui/icons/…`.
    //      `@stackra/ui` is declared as an OPTIONAL peer dep so
    //      consumers that don't ship UI can skip installing it; but the
    //      subpath specifiers (`@stackra/ui/react`,
    //      `@stackra/ui/icons/heroicon/outline`) are NOT the same
    //      literal as the peer name, so tsup's auto-externalizer
    //      misses them and pulls HeroUI + react-aria-components +
    //      use-sync-external-store INTO this package's dist.
    //      Bundling `use-sync-external-store` (a CJS module with a
    //      literal `require("react")`) crashes the browser at boot
    //      with "Dynamic require of \"react\" is not supported"
    //      because the routing package's ESM output can't resolve the
    //      require. Listing every subpath explicitly guarantees they
    //      stay external — the consuming app resolves them through
    //      Vite's own pre-bundle instead.
    external: [
      "vite",
      "react-dom/server",
      "react-router",
      "@stackra/ui",
      "@stackra/ui/react",
      "@stackra/ui/icons/heroicon/outline",
      // ── Self-referencing subpath (testing entry only) ─────────
      //
      // The `./testing` subpath's `renderWithRouting` +
      // `<RoutingTestFrame>` need to publish to the SAME
      // `StackraRoutingContext` module the consumer's
      // `useStackraRoutingContext` reads from — otherwise React
      // sees two distinct `createContext(null)` instances (one
      // bundled in `dist/testing.mjs`, one in `dist/react.mjs`)
      // and `useContext` returns `null` for consumers of the
      // testing helper.
      //
      // Externalising `@stackra/routing/react` here leaves the
      // specifier untouched in `dist/testing.mjs`; at runtime the
      // consuming app's bundler resolves it via this package's
      // own `exports` map to `dist/react.mjs`, so both bundles
      // share the exact same context object.
      //
      // Safe for the `react` entry itself — the `react` subpath's
      // source imports its own context via the internal `@/…`
      // path alias (`@/react/contexts`), NEVER via the public
      // subpath, so tsup never encounters `@stackra/routing/react`
      // while building the `react` entry.
      "@stackra/routing/react",
      // ── Testing library (testing entry only) ──────────────────
      //
      // `@testing-library/react` is a devDependency, not a peer,
      // because only the `./testing` subpath consumes it. Without
      // an explicit external, tsup bundles the entire library into
      // `dist/testing.mjs`. When a consuming app (which also has
      // its own copy of `@testing-library/react`) runs its Vitest
      // suite, the app's `cleanup()` call only unmounts trees
      // registered under the app's copy — leaving the mounts
      // registered under this package's bundled copy in the DOM
      // between tests. Two symptoms result:
      //   1. "Found multiple elements …" — earlier tests' DOM
      //      lingers into later tests.
      //   2. React hooks that assume a single React instance
      //      (`useSyncExternalStore`, `useTransition`, …) crash
      //      with "Invalid hook call" when the bundled copy of the
      //      library imports its own copy of React.
      // Marking `@testing-library/react` external forces
      // `dist/testing.mjs` to import from the consumer's own
      // installed copy — one library instance, one mount registry.
      "@testing-library/react",
    ],
  },
);
