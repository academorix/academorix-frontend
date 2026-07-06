/**
 * @file registry.ts
 * @module lib/module/registry
 *
 * @description
 * Auto-discovers every feature module manifest under {@code src/modules/<name>/}
 * with Vite's {@code import.meta.glob} and aggregates their Refine resources
 * and routes. Add a module folder with a manifest and it is registered — no
 * central edit required.
 *
 * NOTE: {@code import.meta.glob} patterns do **not** resolve the {@code @}
 * alias, so the glob below is written relative to this file
 * ({@code ../../modules/...}, since this file sits two levels deep under
 * {@code src/lib/module/}). The page components inside each manifest still
 * use {@code @/...} lazy imports and stay code-split.
 *
 * ## Single-provider mode
 *
 * The dashboard used to ship a dual-provider layer (real REST + mock
 * fixture-backed) with a {@code BACKEND_READY_RESOURCES} allow-list that
 * pinned unmigrated resources to {@code meta.dataProviderName = "mock"}
 * here. That mock layer has been removed now that every domain module
 * ships a real backend surface. Manifests may still set a
 * {@code meta.dataProviderName} explicitly (e.g. to target a future
 * secondary provider), but nothing is injected implicitly by the
 * registry anymore.
 */

import type { AppModule, AppModuleRoute, AppResource } from "@/lib/module/module";

import { resolveHostContext } from "@/lib/http";

/**
 * Eagerly-loaded module manifests (tiny; the page components stay lazy).
 *
 * Two depths are matched: top-level modules ({@code modules/<name>/<name>.module.tsx})
 * and one level of sub-domain nesting for the sports domain
 * ({@code modules/sports/<sub-domain>/<name>.module.tsx}).
 */
const manifests = import.meta.glob<{ default: AppModule }>(
  ["../../modules/*/*.module.tsx", "../../modules/*/*/*.module.tsx"],
  { eager: true },
);

/** Every registered feature module. */
export const appModules: AppModule[] = Object.values(manifests).map((manifest) => manifest.default);

/** Reads a resource's sidebar sort order (default {@code 0}). */
function resourceOrder(resource: AppResource): number {
  return resource.meta.order ?? 0;
}

/** All resources across every module, sorted for stable sidebar order. */
export const appResources: AppResource[] = appModules
  .flatMap((module) => module.resources ?? [])
  .sort((a, b) => resourceOrder(a) - resourceOrder(b));

/**
 * A resolved keyboard shortcut binding for a resource. Emitted at boot from
 * every module's {@code AppResourceMeta.shortcuts}, then consumed by the
 * shell's keyboard listener. Global chrome shortcuts (⌘K, ⌘B, ?) come from
 * {@code lib/keyboard/registry.ts}, not from here.
 */
export interface ResolvedResourceShortcut {
  /** The resource this binding belongs to ({@code athletes}, {@code teams}, …). */
  resourceName: string;
  /**
   * {@code "navigate"} for {@code G X} bindings, {@code "create"} for
   * {@code N X} bindings, or {@code "custom"} for any resource-scoped verb
   * declared under {@code AppResourceShortcuts.actions}.
   */
  action: "navigate" | "create" | "custom";
  /**
   * The verb identifier for custom actions (matches the key in
   * {@code AppResourceShortcuts.actions}, e.g. {@code "export"},
   * {@code "archive"}). Undefined for {@code "navigate"} and {@code "create"}.
   */
  verbId?: string;
  /** The key sequence, e.g. {@code "G A"} or {@code "N A"}. */
  keys: string;
  /**
   * The route the shell should navigate to when the binding fires. Falls back
   * to {@code resource.list} for navigate bindings and {@code resource.create}
   * for create bindings; undefined for custom verbs (the shell resolves those
   * through the module's command catalogue).
   */
  route: string | undefined;
  /**
   * The permission required to execute this shortcut, mirroring
   * {@code AppResourceMeta.requiredPermission}. The listener silently drops
   * the action when the identity lacks the permission.
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
 * {@code DASHBOARD_UX_PLAN.md} §13.2 for the design rationale.
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
 * {@code hosts} filter are registered everywhere; a filtered route is only
 * mounted when the active host kind is in its list. Keeps central-host
 * workspace pages out of tenant subdomains and vice versa without per-App
 * conditionals.
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
