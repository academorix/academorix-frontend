/**
 * @file registry.ts
 * @module modules/registry
 *
 * @description
 * Auto-discovers every feature module manifest under `src/modules/**` with
 * Vite's `import.meta.glob` and aggregates their Refine resources, routes,
 * palette commands, and keyboard shortcut bindings. Drop a `<name>.module.ts`
 * anywhere under `modules/` and it's registered — no central edit needed.
 */

import { createElement } from "react";

import type { ResourceProps } from "@refinedev/core";

import type {
  AppModule,
  AppResource,
  AppResourceCommand,
  AppResourceShortcuts,
  AppRoute,
  DashboardWidgetContribution,
  RouteTier,
  SidebarGroupKey,
} from "@/lib/module";

import { groupOrder } from "@/lib/groups";
import { Iconify } from "@/icons/iconify";
import { GenericFormPage } from "@/components/generic-form-page";
import { registerWidget } from "@/modules/dashboard/widgets.catalogue";
import { registerWidgetRenderer } from "@/modules/dashboard/widget-renderer";

/** Every module manifest, one and two levels deep for the sports sub-domain. */
const manifests = import.meta.glob<AppModule>(["./*/*.module.ts", "./*/*/*.module.ts"], {
  eager: true,
  import: "default",
});

/** Sort order for a resource — smaller wins. */
function resourceOrder(resource: AppResource): number {
  return resource.meta.order ?? 999;
}

/** Every registered module, sorted by name for a stable dev-tools view. */
export const appModules: AppModule[] = Object.values(manifests).sort((a, b) =>
  a.name.localeCompare(b.name),
);

// ---------------------------------------------------------------------------
// Dashboard widget aggregation (task F2)
// ---------------------------------------------------------------------------
//
// Modules may contribute widgets to the shared dashboard catalogue
// via `AppModule.dashboardWidgets`. We walk every manifest here and
// hand the entries off to `registerWidget` + `registerWidgetRenderer`
// so the widget picker, template gallery, and canvas all pick them
// up alongside the built-in widgets.
//
// The `seenWidgetKeys` guard makes the boot pass idempotent across
// Vite HMR reloads — a hot-reloaded manifest re-runs this file, but
// the registration path stays single-shot per widget key so the
// runtime catalogue never grows duplicates.

/**
 * Widget keys already handed to the dashboard module. Guards
 * against duplicate registration under Vite HMR + accidental
 * duplicate declarations across module manifests. The guard is
 * module-scoped so it persists across the file's re-executions in
 * dev without leaking across full page reloads.
 */
const seenWidgetKeys: Set<string> = new Set();

for (const mod of appModules) {
  const contributions: readonly DashboardWidgetContribution[] = mod.dashboardWidgets ?? [];

  for (const widget of contributions) {
    // First-registration-wins keeps the runtime catalogue stable
    // when two modules accidentally reuse a key — the first module
    // to boot owns the entry, the loser is dropped with a dev-only
    // console warning so the collision surfaces without breaking
    // the boot pass.
    if (seenWidgetKeys.has(widget.key)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[registry] Duplicate dashboard widget "${widget.key}" contributed by "${mod.name}". First registration wins.`,
        );
      }

      continue;
    }

    seenWidgetKeys.add(widget.key);

    // Register the catalogue entry first — the renderer registry
    // reads through `registerWidgetRenderer` which is idempotent
    // on its own, so the ordering here is a soft contract rather
    // than a hard one. Keeping catalogue-then-renderer mirrors the
    // shape of the built-in widgets file.
    registerWidget({
      key: widget.key,
      cohort: widget.cohort,
      title: widget.title,
      description: widget.description,
      icon: widget.icon,
      span: widget.span,
      defaultEnabled: widget.defaultEnabled,
    });

    registerWidgetRenderer(widget.key, widget.render);
  }
}

/**
 * Every setting field a module contributes at boot. Aggregated from
 * `AppModule.settings` on each manifest; the settings module either merges
 * these into its JSON fixture at build time OR pushes them to the backend
 * via `POST /api/settings/schema` on first mount. Every field is tagged
 * with its `owner` so the UI can show "Provided by <module>" chips.
 */
export const appSettings = appModules.flatMap((mod) =>
  (mod.settings ?? []).map((field) => ({ ...field, owner: mod.name })),
);

/**
 * Auto-fill `create` and `edit` refine resource metadata on resources that
 * opted into full CRUD via `meta.crud: "full"`. The paths follow the
 * convention `<list>/create` and `<list>/:id/edit`, so Refine's
 * `useNavigation().create(name)` / `.edit(name, id)` calls resolve cleanly.
 * Read-only resources still get a canonical `show` path if they don't have one.
 */
function withAutoCrudPaths(resource: AppResource): AppResource {
  const crud = resource.meta.crud ?? "list-only";
  const listPath = typeof resource.list === "string" ? resource.list : undefined;

  if (!listPath || crud === "none") return resource;

  const patch: Partial<AppResource> = {};

  if (crud === "full") {
    if (!resource.create) patch.create = `${listPath}/create`;
    if (!resource.edit) patch.edit = `${listPath}/:id/edit`;
  }
  if (!resource.show && (crud === "full" || crud === "read-only")) {
    patch.show = `${listPath}/:id`;
  }

  if (Object.keys(patch).length === 0) return resource;

  return { ...resource, ...patch };
}

/** Every resource across every module, sorted by `meta.order` then label. */
export const appResources: AppResource[] = appModules
  .flatMap((mod) => mod.resources ?? [])
  .map(withAutoCrudPaths)
  .sort((a, b) => resourceOrder(a) - resourceOrder(b) || a.meta.label.localeCompare(b.meta.label));

/**
 * Auto-generated `create` + `edit` routes for every resource that has
 * declared a `formFields` schema (or opted into auto-CRUD via `crud: "full"`
 * — even without a schema, in which case the generic form shows a friendly
 * "no fields declared" notice). Wired to `GenericFormPage`, so modules get a
 * working editor for free.
 */
function autoFormRoutes(): AppRoute[] {
  const seen = new Set<string>();

  for (const mod of appModules) {
    for (const route of mod.routes ?? []) {
      // Skip index routes (no `path` — set via `index: true`).
      if (route.path) seen.add(route.path);
    }
  }
  const routes: AppRoute[] = [];

  for (const resource of appResources) {
    const crud = resource.meta.crud ?? "list-only";

    if (crud === "none" || crud === "list-only" || crud === "read-only") continue;
    if (typeof resource.list !== "string") continue;

    const createPath = `${resource.list}/create`;
    const editPath = `${resource.list}/:id/edit`;

    if (!seen.has(createPath)) {
      routes.push({
        path: createPath,
        tier: "protected",
        element: createElement(GenericFormPage, { action: "create", resource: resource.name }),
      });
      seen.add(createPath);
    }
    if (!seen.has(editPath)) {
      routes.push({
        path: editPath,
        tier: "protected",
        element: createElement(GenericFormPage, { action: "edit", resource: resource.name }),
      });
      seen.add(editPath);
    }
  }

  return routes;
}

/** Every route across every module — module-provided first, then auto-generated form routes. */
export const appRoutes: AppRoute[] = [
  ...appModules.flatMap((mod) => mod.routes ?? []),
  ...autoFormRoutes(),
];

/** Filter helper — used by the router when it splits public vs protected routes. */
export function routesForTier(tier: RouteTier): AppRoute[] {
  return appRoutes.filter((route) => (route.tier ?? "protected") === tier);
}

/**
 * Every route flagged as `tier: "public"` — the router renders these
 * outside `<AppShell>` (login, register, forgot-password, etc.). Kept
 * as a top-level constant (rather than a `routesForTier("public")`
 * call at every consumer site) so `App.tsx` and any other splitter
 * imports the same reference.
 */
export const publicRoutes: AppRoute[] = routesForTier("public");

/**
 * Every route flagged as `tier: "protected"` (the default) — the
 * router renders these inside `<AppShell>` (sidebar + navbar + aside).
 * Same rationale as {@link publicRoutes}: one shared reference so the
 * router and any diagnostic surface agree on the same list.
 */
export const protectedRoutes: AppRoute[] = routesForTier("protected");

/**
 * Every route flagged as `tier: "embed"` — rendered OUTSIDE `<App>`
 * entirely for anonymous embed contexts. Rare; kept alongside the
 * other tiers for symmetry.
 */
export const embedRoutes: AppRoute[] = routesForTier("embed");

/**
 * Every route flagged as `tier: "chromeless"` — rendered inside
 * `<App>` (providers + auth) but OUTSIDE `<AppShell>` (no sidebar or
 * navbar chrome). Used for presenter / focus modes.
 */
export const chromelessRoutes: AppRoute[] = routesForTier("chromeless");

/**
 * Refine's `ResourceProps` at the boundary. We wrap each string icon token in
 * a live `<Iconify>` element so `useMenu()` and any Refine surface can render
 * the icon without knowing about our token convention.
 */
export const refineResources: ResourceProps[] = appResources.map((resource) => ({
  ...resource,
  meta: {
    ...resource.meta,
    icon: resource.meta.icon ? createElement(Iconify, { icon: resource.meta.icon }) : undefined,
  },
})) as ResourceProps[];

// ---------------------------------------------------------------------------
// Sidebar nav derivation
// ---------------------------------------------------------------------------

export type NavItem = {
  name: string;
  href: string;
  label: string;
  icon?: string;
  order: number;
  groupKey: SidebarGroupKey | "other";
  comingSoon?: boolean;
  shortcuts?: AppResourceShortcuts;
  requiredPermission?: string;
};

export type NavGroupWithItems = {
  key: SidebarGroupKey | "other";
  labelKey: string;
  items: NavItem[];
};

/**
 * Every resource that has a `list` route, projected into a nav item.
 * Consumers filter by identity (feature / permission) before rendering.
 */
export const navItems: NavItem[] = appResources
  .filter((r): r is AppResource & { list: string } => typeof r.list === "string")
  .map((r) => ({
    name: r.name,
    href: r.list,
    label: r.meta.label,
    icon: r.meta.icon,
    order: r.meta.order ?? 999,
    groupKey: r.meta.groupKey ?? "other",
    comingSoon: r.meta.comingSoon,
    shortcuts: r.meta.shortcuts,
    requiredPermission: r.meta.requiredPermission,
  }));

/** Group projection — used by the sidebar + palette to build sections. */
export const navGroupsWithItems: NavGroupWithItems[] = (() => {
  const buckets = new Map<SidebarGroupKey | "other", NavItem[]>();

  for (const item of navItems) {
    const bucket = buckets.get(item.groupKey) ?? [];

    bucket.push(item);
    buckets.set(item.groupKey, bucket);
  }

  const out: NavGroupWithItems[] = [];

  for (const [key, items] of buckets.entries()) {
    items.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    out.push({ key, labelKey: `sidebar.group.${key}`, items });
  }

  return out.sort((a, b) => groupOrder[a.key] - groupOrder[b.key]);
})();

/** Find the nav item whose `href` best matches a pathname (longest prefix wins). */
export function findNavItemByPath(pathname: string): NavItem | undefined {
  return [...navItems]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

// ---------------------------------------------------------------------------
// Palette / shortcut aggregation
// ---------------------------------------------------------------------------

/** A resolved leader-key binding emitted at boot. */
export type ResolvedShortcut = {
  resourceName: string;
  action: "navigate" | "create" | "custom";
  verbId?: string;
  keys: string;
  route: string | undefined;
  requiredPermission: string | undefined;
};

function warnDuplicate(seen: Map<string, string>, keys: string, resourceName: string): void {
  const existing = seen.get(keys);

  if (existing && existing !== resourceName && import.meta.env.DEV) {
    console.warn(
      `[registry] Duplicate shortcut "${keys}" on "${existing}" and "${resourceName}". First binding wins.`,
    );
  } else if (!existing) {
    seen.set(keys, resourceName);
  }
}

export const appShortcuts: ResolvedShortcut[] = (() => {
  const bindings: ResolvedShortcut[] = [];
  const seen = new Map<string, string>();

  for (const resource of appResources) {
    const shortcuts = resource.meta.shortcuts;

    if (!shortcuts) continue;

    if (shortcuts.navigate) {
      warnDuplicate(seen, shortcuts.navigate, resource.name);
      bindings.push({
        resourceName: resource.name,
        action: "navigate",
        keys: shortcuts.navigate,
        route: typeof resource.list === "string" ? resource.list : undefined,
        requiredPermission: resource.meta.requiredPermission,
      });
    }

    if (shortcuts.create && typeof resource.create === "string") {
      warnDuplicate(seen, shortcuts.create, resource.name);
      bindings.push({
        resourceName: resource.name,
        action: "create",
        keys: shortcuts.create,
        route: resource.create,
        requiredPermission: resource.meta.requiredPermission,
      });
    }

    if (shortcuts.actions) {
      for (const [verbId, keys] of Object.entries(shortcuts.actions)) {
        warnDuplicate(seen, keys, resource.name);
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

/** Every extra ⌘K command contributed via `meta.commands`. */
export const appCommands: (AppResourceCommand & {
  resourceName: string;
  groupKey: SidebarGroupKey | "other";
})[] = appResources.flatMap((resource) =>
  (resource.meta.commands ?? []).map((command) => ({
    ...command,
    resourceName: resource.name,
    groupKey: resource.meta.groupKey ?? "other",
  })),
);
