/**
 * @file module.ts
 * @module app/module
 *
 * @description
 * The contract every feature module implements. A module co-locates its screens
 * (in `src/modules/<name>/pages`) and declares — in one `*.module.tsx` manifest —
 * the Refine **resources** and **routes** it contributes. The {@link "@/app/registry"}
 * aggregates every manifest so `App.tsx` and `providers.tsx` never import feature
 * code directly.
 *
 * See `.kiro/steering/frontend-module-architecture.md` for the full standard.
 */

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
  /** Sidebar glyph. */
  icon?: ReactElement;
  /** Tenant feature-toggle key; hidden unless the manifest enables it. */
  featureKey?: string;
  /** Permission required to see/enter, e.g. `"athletes.viewAny"`. */
  requiredPermission?: string;
  /** Parent resource name for nav grouping. */
  parent?: string;
  /** Sort order in the sidebar (ascending; default `0`). */
  order?: number;
}

/**
 * A feature module: the Refine resources it registers and the routes it serves.
 * Default-exported from each `src/modules/<name>/<name>.module.tsx`.
 */
export interface AppModule {
  /** Lowercase module name, matching the backend module (e.g. `"athletes"`). */
  name: string;
  /** Refine resources contributed by this module. */
  resources?: ResourceProps[];
  /** Routes contributed by this module. */
  routes?: AppModuleRoute[];
}
