/**
 * @file container.config.ts
 * @module @academorix/dashboard/config
 * @description DI container bootstrap options.
 *
 *   Passed to `ApplicationFactory.create(AppModule, await containerConfig())`
 *   at boot. Authored as a `registerAs` factory so the value also lands
 *   under `ConfigService.get('container')` for anything that wants to
 *   introspect the flags at runtime (devtools panels, debug endpoints).
 *
 *   ## Build-time vs. runtime env access
 *
 *   `import.meta.env.DEV` (and its siblings `PROD` / `MODE`) are **Vite
 *   build-time constants**. Vite replaces them with literal booleans at
 *   compile time, which is what enables dev-only code to tree-shake in
 *   the production bundle. Rewriting them as `env.bool('DEV', false)`
 *   would defeat that optimisation — the flag would become a runtime
 *   lookup and the dead-branch elimination would break. We deliberately
 *   keep `import.meta.env.DEV` on the RHS of `debug:` and add a comment
 *   at the call site so future maintainers don't "helpfully" migrate it.
 *
 *   Any genuinely runtime-driven container option (there are none today)
 *   would use `env(...)` normally.
 *
 * @example
 * ```typescript
 * import { ApplicationFactory } from '@stackra/container';
 * import { containerConfig } from '@/config/container.config';
 *
 * // `registerAs` returns a factory — invoke + await to get the value.
 * const app = await ApplicationFactory.create(AppModule, await containerConfig());
 * ```
 */

import { registerAs } from "@stackra/config";

/**
 * DI-container bootstrap namespace — reachable via
 * `ConfigService.get('container')`, and consumed at the
 * `ApplicationFactory.create` call site as `await containerConfig()`.
 *
 * The workspace's canonical shape for these options is
 * `IApplicationFactoryOptions` in `@stackra/container` — that
 * interface is currently NOT re-exported from the package's public
 * barrel, so we let TypeScript infer the return type from the
 * literal below. `ApplicationFactory.create` still enforces the
 * shape at the call site (`main.tsx`), so any drift in the
 * interface surface faults there instead of here.
 *
 * When `@stackra/container` re-exports `IApplicationFactoryOptions`
 * from its public entry, add `registerAs<IApplicationFactoryOptions>`
 * back here to catch shape drift at authoring time.
 */
export const containerConfig = registerAs("container", () => ({
  /*
  |--------------------------------------------------------------------------
  | Debug Mode
  |--------------------------------------------------------------------------
  |
  | When true, exposes the application instance on `window[globalName]`
  | for browser devtools inspection:
  |   window.__APP__.get(UserService)
  |
  | FIXME: `import.meta.env.DEV` is a Vite BUILD-TIME constant — do not
  | migrate to `env.bool('DEV', false)`. The literal replacement is what
  | tree-shakes dev-only branches out of the production bundle; a runtime
  | env lookup would defeat that optimisation.
  |
  */
  debug: import.meta.env.DEV,

  /*
  |--------------------------------------------------------------------------
  | Global Name
  |--------------------------------------------------------------------------
  |
  | The window property name for debug access.
  | Only used when `debug` is true.
  |
  */
  globalName: "__APP__",

  /*
  |--------------------------------------------------------------------------
  | Shutdown Hooks
  |--------------------------------------------------------------------------
  |
  | Register `beforeunload` / `SIGTERM` shutdown hooks automatically.
  | Triggers `onModuleDestroy` and `onApplicationShutdown` on all providers.
  |
  */
  shutdownHooks: true,

  /*
  |--------------------------------------------------------------------------
  | Resolution Logging
  |--------------------------------------------------------------------------
  |
  | Prints the full dependency graph during bootstrap.
  | Shows: modules → providers → scopes → dependencies → lifecycle hooks.
  | Disable in production for performance.
  |
  */
  logging: {
    enabled: true,
    resolution: true,
    lifecycle: true,
    timing: true,
    graph: true,
    colors: true,
  },
}));
