/**
 * @file module.ts
 * @module lib/module/module
 *
 * @description
 * The contract every feature module implements. A module co-locates its screens
 * (in `src/modules/<name>/pages`) and declares — in one `*.module.tsx` manifest —
 * the Refine **resources** and **routes** it contributes. The
 * {@link "@/lib/module/registry"} aggregates every manifest so `App.tsx` and
 * `providers.tsx` never import feature code directly.
 *
 * See `.kiro/steering/frontend-module-architecture.md` for the full standard.
 */

import type { ScopeDimension } from "@/lib/scope/scope.types";
import type { IconType } from "@academorix/ui/icons";
import type { ResourceProps } from "@refinedev/core";
import type { ReactElement } from "react";

/** Which authentication tier a route belongs to. */
export type RouteTier = "public" | "protected";

/** A single route contributed by a module. */
export interface AppModuleRoute {
  /** `"public"` (landing/login) or `"protected"` (inside the app shell). */
  tier: RouteTier;
  /** Path segment; omit and set {@link index} for the index route. */
  path?: string;
  /** Whether this is the index (`/`) route. */
  index?: boolean;
  /** The (lazy) element to render. Build with `createElement(lazy(...))`. */
  element: ReactElement;
  /**
   * For public routes only: if the visitor is already authenticated, redirect
   * here instead of rendering the element (e.g. `/login` → `/dashboard`).
   */
  redirectAuthenticatedTo?: string;
}

/**
 * Academorix-specific resource metadata, stored on `ResourceProps.meta`.
 * Drives the sidebar (label/icon/order) and gating (feature toggle + permission).
 */
export interface AppResourceMeta {
  /** Default nav label; overridden per tenant by `terminology` from `/auth/me`. */
  label: string;
  /** Sidebar glyph — an icon *component* (the layout controls its size). */
  icon?: IconType;
  /** Tenant feature-toggle key; hidden unless the manifest enables it. */
  featureKey?: string;
  /** Permission required to see/enter, e.g. `"athletes.viewAny"`. */
  requiredPermission?: string;
  /** Parent resource name for nav grouping. */
  parent?: string;
  /** Sort order in the sidebar (ascending; default `0`). */
  order?: number;
  /**
   * Which working-scope dimensions this resource is filtered by. When set, the
   * {@link "@/components/refine/resource-data-grid".ResourceDataGrid} appends the
   * active organization/branch/season as permanent list filters, so the table
   * reflects the current scope and refetches when it changes.
   */
  scopedBy?: ScopeDimension[];
}

/**
 * A Refine resource whose `meta` is strongly typed as {@link AppResourceMeta}
 * (so `icon`, `featureKey`, `requiredPermission`, and `order` are all checked).
 * The registry casts these to Refine's `ResourceProps` at the `<Refine>`
 * boundary — Refine's `meta.icon` is `ReactNode`, ours is an icon component.
 */
export type AppResource = Omit<ResourceProps, "meta"> & { meta: AppResourceMeta };

/**
 * A feature module: the Refine resources it registers and the routes it serves.
 * Default-exported from each `src/modules/<name>/<name>.module.tsx`.
 */
export interface AppModule {
  /** Lowercase module name, matching the backend module (e.g. `"athletes"`). */
  name: string;
  /** Refine resources contributed by this module. */
  resources?: AppResource[];
  /** Routes contributed by this module. */
  routes?: AppModuleRoute[];
}
