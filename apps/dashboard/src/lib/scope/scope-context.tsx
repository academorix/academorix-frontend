/**
 * @file scope-context.tsx
 * @module lib/scope/scope-context
 *
 * @description
 * The {@link ScopeProvider} and React context backing the working-scope layer.
 * It reads the caller's accessible scopes from the authenticated identity
 * (`/auth/me` → `identity.scopes`), resolves the active Organization → Branch →
 * Season (from persisted storage, validated, else sensible defaults), keeps the
 * selection consistent (changing organization re-validates the branch), and
 * persists changes per tenant.
 *
 * Mount inside the authenticated area (it depends on the identity). Consumers
 * read it via {@link "@/lib/scope/use-scope".useScope}.
 */

import { useGetIdentity } from "@refinedev/core";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import type {
  ActiveScope,
  BranchOption,
  OrganizationOption,
  ScopeContextValue,
  SeasonOption,
} from "@/lib/scope/scope.types";
import type { Identity } from "@/types";
import type { ReactNode } from "react";

import { readStoredScope, writeStoredScope } from "@/lib/scope/scope-storage";

/** Empty allowed-scopes shape used before the identity resolves. */
const EMPTY_ALLOWED: Identity["scopes"] = { organizations: [], branches: [], seasons: [] };

/**
 * The scope context. `undefined` outside a provider so {@link
 * "@/lib/scope/use-scope".useScope} can throw a helpful error.
 */
export const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

/** Returns the branches belonging to a given organization. */
function branchesForOrganization(
  branches: BranchOption[],
  organizationId: string | null,
): BranchOption[] {
  if (!organizationId) {
    return [];
  }

  return branches.filter((branch) => branch.organization_id === organizationId);
}

/** Picks the default option id: the one flagged default, else the first, else null. */
function pickDefault(options: Array<{ id: string; is_default?: boolean }>): string | null {
  return options.find((option) => option.is_default)?.id ?? options[0]?.id ?? null;
}

/** Picks the current season id: the one flagged current, else the first, else null. */
function pickDefaultSeason(seasons: SeasonOption[]): string | null {
  return seasons.find((season) => season.is_current)?.id ?? seasons[0]?.id ?? null;
}

/**
 * Resolves a valid {@link ActiveScope} from the allowed scopes and any persisted
 * selection. Invalid/stale ids fall back to defaults; the branch is always
 * validated against the resolved organization.
 */
function resolveScope(allowed: Identity["scopes"], stored: ActiveScope | null): ActiveScope {
  const organizations = allowed.organizations;
  const storedOrgValid =
    stored?.organizationId && organizations.some((org) => org.id === stored.organizationId);
  const organizationId = storedOrgValid ? stored!.organizationId : pickDefault(organizations);

  const orgBranches = branchesForOrganization(allowed.branches, organizationId);
  const storedBranchValid =
    stored?.branchId && orgBranches.some((branch) => branch.id === stored.branchId);
  const branchId = storedBranchValid ? stored!.branchId : pickDefault(orgBranches);

  const storedSeasonValid =
    stored?.seasonId && allowed.seasons.some((season) => season.id === stored.seasonId);
  const seasonId = storedSeasonValid ? stored!.seasonId : pickDefaultSeason(allowed.seasons);

  return { organizationId, branchId, seasonId };
}

/** Props for {@link ScopeProvider}. */
interface ScopeProviderProps {
  /** The authenticated subtree that consumes scope. */
  children: ReactNode;
}

/**
 * Provides the active working scope to the authenticated app. Seeds from the
 * identity's allowed scopes + persisted selection, and keeps the selection
 * valid and persisted as the user switches.
 *
 * @param props - The subtree to render once scope is available.
 */
export function ScopeProvider({ children }: ScopeProviderProps): ReactNode {
  const { data: identity } = useGetIdentity<Identity>();
  const allowed = identity?.scopes ?? EMPTY_ALLOWED;
  const tenantSlug = identity?.tenant.slug ?? null;

  // `null` until the identity has loaded and we've resolved the scope.
  const [scope, setScope] = useState<ActiveScope | null>(null);

  // Resolve (and validate) the active scope whenever the identity changes.
  useEffect(() => {
    if (!identity || !tenantSlug) {
      return;
    }

    const stored = readStoredScope(tenantSlug);

    setScope(resolveScope(identity.scopes, stored));
  }, [identity, tenantSlug]);

  // Persist any resolved scope change, namespaced by tenant.
  useEffect(() => {
    if (scope && tenantSlug) {
      writeStoredScope(tenantSlug, scope);
    }
  }, [scope, tenantSlug]);

  const setOrganization = useCallback(
    (id: string | null) => {
      setScope((current) => {
        const seasonId = current?.seasonId ?? pickDefaultSeason(allowed.seasons);
        const orgBranches = branchesForOrganization(allowed.branches, id);
        // Keep the branch only if it still belongs to the new organization.
        const keepBranch =
          current?.branchId && orgBranches.some((branch) => branch.id === current.branchId);
        const branchId = keepBranch ? current!.branchId : pickDefault(orgBranches);

        return { organizationId: id, branchId, seasonId };
      });
    },
    [allowed.branches, allowed.seasons],
  );

  const setBranch = useCallback((id: string | null) => {
    setScope((current) => ({
      organizationId: current?.organizationId ?? null,
      seasonId: current?.seasonId ?? null,
      branchId: id,
    }));
  }, []);

  const setSeason = useCallback((id: string | null) => {
    setScope((current) => ({
      organizationId: current?.organizationId ?? null,
      branchId: current?.branchId ?? null,
      seasonId: id,
    }));
  }, []);

  const value = useMemo<ScopeContextValue>(() => {
    const active: ActiveScope = scope ?? {
      organizationId: null,
      branchId: null,
      seasonId: null,
    };
    const orgBranches = branchesForOrganization(allowed.branches, active.organizationId);

    const organization: OrganizationOption | undefined = allowed.organizations.find(
      (org) => org.id === active.organizationId,
    );
    const branch: BranchOption | undefined = orgBranches.find(
      (item) => item.id === active.branchId,
    );
    const season: SeasonOption | undefined = allowed.seasons.find(
      (item) => item.id === active.seasonId,
    );

    return {
      scope: active,
      setOrganization,
      setBranch,
      setSeason,
      organization,
      branch,
      season,
      allowed: {
        organizations: allowed.organizations,
        branches: orgBranches,
        seasons: allowed.seasons,
      },
      isReady: scope !== null,
    };
  }, [scope, allowed, setOrganization, setBranch, setSeason]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}
