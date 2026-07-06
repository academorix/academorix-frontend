/**
 * @file scope.types.ts
 * @module lib/scope/scope.types
 *
 * @description
 * Types for the **working scope** — the Organization → Branch → Season the user
 * is currently operating in. Tenant is fixed by the host/identity and handled by
 * {@link "@/lib/scope/use-tenant"}; this layer covers the scopes the user
 * actively switches between, which drive navigation, the switchers, and the
 * data-provider filters.
 *
 * @see .kiro/specs/frontend-domain-rebuild/design.md §1 "The hierarchy & scope model"
 */

import type { AllowedScopes } from "@/types";

/** The scope dimensions a resource can be filtered by. */
export type ScopeDimension = "organization" | "branch" | "season";

/**
 * The currently-active working scope. Each id is `null` until resolved (no
 * selection yet / none available).
 */
export interface ActiveScope {
  /** Active organization id, or `null`. */
  organizationId: string | null;
  /** Active branch id (must belong to the active organization), or `null`. */
  branchId: string | null;
  /** Active season id, or `null`. */
  seasonId: string | null;
}

/** An organization option surfaced to the organization switcher. */
export type OrganizationOption = AllowedScopes["organizations"][number];
/** A branch option (tagged with its organization) for the branch switcher. */
export type BranchOption = AllowedScopes["branches"][number];
/** A season option (tagged with status/current) for the season switcher. */
export type SeasonOption = AllowedScopes["seasons"][number];

/**
 * The value exposed by the scope context / {@link "@/lib/scope/use-scope".useScope}.
 * Holds the active scope, setters (which cascade — changing org re-validates the
 * branch), the resolved option objects, the caller's allowed scopes (already
 * filtered to the active organization for `branches`), and a readiness flag.
 */
export interface ScopeContextValue {
  /** The active scope ids. */
  scope: ActiveScope;
  /** Sets the active organization; resets branch if it leaves the new org. */
  setOrganization: (id: string | null) => void;
  /** Sets the active branch (must belong to the active organization). */
  setBranch: (id: string | null) => void;
  /** Sets the active season. */
  setSeason: (id: string | null) => void;
  /** Resolved active organization option, if any. */
  organization?: OrganizationOption;
  /** Resolved active branch option, if any. */
  branch?: BranchOption;
  /** Resolved active season option, if any. */
  season?: SeasonOption;
  /** Available options (branches already filtered to the active organization). */
  allowed: {
    organizations: OrganizationOption[];
    branches: BranchOption[];
    seasons: SeasonOption[];
  };
  /** True once the identity has loaded and the scope has been resolved. */
  isReady: boolean;
}
