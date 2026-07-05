/**
 * @file registry.ts
 * @module lib/module/registry
 *
 * @description
 * Auto-discovers every feature module manifest under `src/modules/<name>/`
 * with Vite's `import.meta.glob` and aggregates their Refine resources and
 * routes. Add a module folder with a manifest and it is registered — no
 * central edit required.
 *
 * NOTE: `import.meta.glob` patterns do **not** resolve the `@` alias, so the
 * glob below is written relative to this file (`../../modules/...`, since this
 * file sits two levels deep under `src/lib/module/`). The page components
 * inside each manifest still use `@/...` lazy imports and stay code-split.
 *
 * ## Multi-data-provider migration
 * A resource whose backend module has not shipped yet has its
 * `meta.dataProviderName` set to `"mock"` here at boot, based on the
 * {@link BACKEND_READY_RESOURCES} allow-list. This lets us keep every
 * feature module `dataProviderName`-free (fewer per-manifest edits) and
 * migrate to the real REST provider by editing a single allow-list —
 * see PLAN.md §4.5.
 */

import type { AppModule, AppModuleRoute, AppResource } from "@/lib/module/module";

import { resolveHostContext } from "@/lib/http";
import { BACKEND_READY_RESOURCES } from "@/providers/data";

/**
 * Eagerly-loaded module manifests (tiny; the page components stay lazy).
 *
 * Two depths are matched: top-level modules (`modules/<name>/<name>.module.tsx`)
 * and one level of sub-domain nesting for the sports domain
 * (`modules/sports/<sub-domain>/<name>.module.tsx`).
 */
const manifests = import.meta.glob<{ default: AppModule }>(
  ["../../modules/*/*.module.tsx", "../../modules/*/*/*.module.tsx"],
  { eager: true },
);

/** Every registered feature module. */
export const appModules: AppModule[] = Object.values(manifests).map((manifest) => manifest.default);

/** Reads a resource's sidebar sort order (default `0`). */
function resourceOrder(resource: AppResource): number {
  return resource.meta.order ?? 0;
}

/**
 * Applies the backend-ready allow-list to a resource: if the resource is NOT
 * in the list AND its manifest has not already set a `dataProviderName`, we
 * pin it to `"mock"` so Refine reads from the fixture provider instead of the
 * REST provider (which would 404).
 */
function withDataProvider(resource: AppResource): AppResource {
  if (resource.meta.dataProviderName) {
    return resource;
  }

  if (BACKEND_READY_RESOURCES.has(resource.name)) {
    return resource;
  }

  return {
    ...resource,
    meta: { ...resource.meta, dataProviderName: "mock" },
  };
}

/** All resources across every module, sorted for stable sidebar order. */
export const appResources: AppResource[] = appModules
  .flatMap((module) => module.resources ?? [])
  .map(withDataProvider)
  .sort((a, b) => resourceOrder(a) - resourceOrder(b));

/**
 * Whether a route is registered under the current host. Routes without a
 * `hosts` filter are registered everywhere; a filtered route is only mounted
 * when the active host kind is in its list. Keeps central-host workspace
 * pages out of tenant subdomains and vice versa without per-App conditionals.
 */
function isRouteVisibleOnCurrentHost(route: AppModuleRoute): boolean {
  if (!route.hosts || route.hosts.length === 0) {
    return true;
  }

  return route.hosts.includes(resolveHostContext().kind);
}

/** Public routes (landing, login, workspace picker) contributed by all modules. */
export const publicRoutes: AppModuleRoute[] = appModules.flatMap(
  (module) =>
    module.routes?.filter(
      (route) => route.tier === "public" && isRouteVisibleOnCurrentHost(route),
    ) ?? [],
);

/** Protected routes (inside the app shell) contributed by all modules. */
export const protectedRoutes: AppModuleRoute[] = appModules.flatMap(
  (module) =>
    module.routes?.filter(
      (route) => route.tier === "protected" && isRouteVisibleOnCurrentHost(route),
    ) ?? [],
);
