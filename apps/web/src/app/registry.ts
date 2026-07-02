/**
 * @file registry.ts
 * @module app/registry
 *
 * @description
 * Auto-discovers every feature module manifest under `src/modules/<name>/`
 * with Vite's `import.meta.glob` and aggregates their Refine resources and
 * routes. Add a module folder with a manifest and it is registered — no central
 * edit required.
 *
 * NOTE: `import.meta.glob` patterns do **not** resolve the `@` alias, so the
 * glob below is written relative to this file (`../modules/...`). The page
 * components inside each manifest still use `@/...` lazy imports and stay
 * code-split.
 */

import type { AppModule, AppModuleRoute } from "@/app/module";
import type { AppResourceMeta } from "@/app/module";
import type { ResourceProps } from "@refinedev/core";

/** Eagerly-loaded module manifests (tiny; the page components stay lazy). */
const manifests = import.meta.glob<{ default: AppModule }>("../modules/*/*.module.tsx", {
  eager: true,
});

/** Every registered feature module. */
export const appModules: AppModule[] = Object.values(manifests).map((manifest) => manifest.default);

/** Reads a resource's sidebar sort order (default `0`). */
function resourceOrder(resource: ResourceProps): number {
  return (resource.meta as AppResourceMeta | undefined)?.order ?? 0;
}

/** All Refine resources across every module, sorted for stable sidebar order. */
export const appResources: ResourceProps[] = appModules
  .flatMap((module) => module.resources ?? [])
  .sort((a, b) => resourceOrder(a) - resourceOrder(b));

/** Public routes (landing, login) contributed by all modules. */
export const publicRoutes: AppModuleRoute[] = appModules.flatMap(
  (module) => module.routes?.filter((route) => route.tier === "public") ?? [],
);

/** Protected routes (inside the app shell) contributed by all modules. */
export const protectedRoutes: AppModuleRoute[] = appModules.flatMap(
  (module) => module.routes?.filter((route) => route.tier === "protected") ?? [],
);
