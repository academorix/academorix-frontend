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
 * A resolved keyboard shortcut binding for a resource. Emitted at boot from
 * every module's `AppResourceMeta.shortcuts`, then consumed by the shell's
 * keyboard listener. Global chrome shortcuts (⌘K, ⌘B, ?) come from
 * `lib/keyboard/registry.ts`, not from here.
 */
export interface ResolvedResourceShortcut {
  /** The resource this binding belongs to (`athletes`, `teams`, …). */
  resourceName: string;
  /**
   * `"navigate"` for `G X` bindings, `"create"` for `N X` bindings, or
   * `"custom"` for any resource-scoped verb declared under
   * `AppResourceShortcuts.actions`.
   */
  action: "navigate" | "create" | "custom";
  /**
   * The verb identifier for custom actions (matches the key in
   * `AppResourceShortcuts.actions`, e.g. `"export"`, `"archive"`). Undefined
   * for `"navigate"` and `"create"`.
   */
  verbId?: string;
  /** The key sequence, e.g. `"G A"` or `"N A"`. */
  keys: string;
  /**
   * The route the shell should navigate to when the binding fires. Falls back
   * to `resource.list` for navigate bindings and `resource.create` for create
   * bindings; undefined for custom verbs (the shell resolves those through the
   * module's command catalogue).
   */
  route: string | undefined;
  /**
   * The permission required to execute this shortcut, mirroring
   * `AppResourceMeta.requiredPermission`. The listener silently drops the
   * action when the identity lacks the permission.
   */
  requiredPermission: string | undefined;
}

/**
 * Warns (in dev) if two resources claim the same keyboard shortcut sequence.
 * Silent in production so a badly-authored PR does not spam an end user's
 * console; the shell simply picks the first-registered binding in that case.
 */
function warnOnDuplicateShortcut(
  seen: Map<string, string>,
  keys: string,
  resourceName: string,
): void {
  const existing = seen.get(keys);

  if (existing && existing !== resourceName) {
    // eslint-disable-next-line no-console
    console.warn(
      `[module-registry] Duplicate keyboard shortcut "${keys}" on resources "${existing}" and "${resourceName}". First binding wins.`,
    );

    return;
  }

  seen.set(keys, resourceName);
}

/**
 * Resource-scoped keyboard shortcut bindings, aggregated across every module
 * manifest. See {@link ResolvedResourceShortcut} for the shape and
 * `DASHBOARD_UX_PLAN.md` §13.2 for the design rationale.
 */
export const appResourceShortcuts: ResolvedResourceShortcut[] = (() => {
  const bindings: ResolvedResourceShortcut[] = [];
  const seen = new Map<string, string>();

  for (const resource of appResources) {
    const shortcuts = resource.meta.shortcuts;

    if (!shortcuts) {
      continue;
    }

    if (shortcuts.navigate) {
      warnOnDuplicateShortcut(seen, shortcuts.navigate, resource.name);
      bindings.push({
        resourceName: resource.name,
        action: "navigate",
        keys: shortcuts.navigate,
        route: typeof resource.list === "string" ? resource.list : undefined,
        requiredPermission: resource.meta.requiredPermission,
      });
    }

    if (shortcuts.create && resource.create) {
      warnOnDuplicateShortcut(seen, shortcuts.create, resource.name);
      bindings.push({
        resourceName: resource.name,
        action: "create",
        keys: shortcuts.create,
        route: typeof resource.create === "string" ? resource.create : undefined,
        requiredPermission: resource.meta.requiredPermission,
      });
    }

    if (shortcuts.actions) {
      for (const [verbId, keys] of Object.entries(shortcuts.actions)) {
        warnOnDuplicateShortcut(seen, keys, resource.name);
        bindings.push({
          resourceName: resource.name,
          action: "custom",
          verbId,
          keys,
          route: undefined,
          requiredPermission: resource.meta.requiredPermission,
        });
      }
    }
  }

  return bindings;
})();

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
