/**
 * @file registry.ts
 * @module lib/module/registry
 *
 * @description
 * Auto-discovers every feature module manifest under `src/modules/<name>/`
 * with Vite's `import.meta.glob` and aggregates their Refine resources and
 * routes. Add a module folder with a manifest and it is registered — no central
 * edit required.
 *
 * NOTE: `import.meta.glob` patterns do **not** resolve the `@` alias, so the
 * glob below is written relative to this file (`../../modules/...`, since this
 * file sits two levels deep under `src/lib/module/`). The page components
 * inside each manifest still use `@/...` lazy imports and stay code-split.
 */

import type { AppModule, AppModuleRoute, AppResource } from "@/lib/module/module";

/** Eagerly-loaded module manifests (tiny; the page components stay lazy). */
const manifests = import.meta.glob<{ default: AppModule }>("../../modules/*/*.module.tsx", {
  eager: true,
});

/** Every registered feature module. */
export const appModules: AppModule[] = Object.values(manifests).map((manifest) => manifest.default);

/** Reads a resource's sidebar sort order (default `0`). */
function resourceOrder(resource: AppResource): number {
  return resource.meta.order ?? 0;
}

/** All resources across every module, sorted for stable sidebar order. */
export const appResources: AppResource[] = appModules
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
