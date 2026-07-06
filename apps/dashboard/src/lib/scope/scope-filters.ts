/**
 * @file scope-filters.ts
 * @module lib/scope/scope-filters
 *
 * @description
 * Translates the active {@link ActiveScope} into Refine `CrudFilters` for the
 * scope dimensions a resource opts into (`meta.scopedBy`). Passed as
 * **permanent** filters on `useTable`, these compose with (never override) the
 * user's own filters and reach the data provider as `filter[organization_id]=…`,
 * `filter[branch_id]=…`, `filter[season_id]=…` (spatie query contract). Because
 * they are part of Refine's query key, changing scope refetches lists
 * automatically — no manual invalidation needed.
 */

import type { ActiveScope, ScopeDimension } from "@/lib/scope/scope.types";
import type { CrudFilter } from "@refinedev/core";

/** Maps a scope dimension to the record column it filters and the active id. */
const DIMENSION_FIELD: Record<ScopeDimension, keyof ActiveScope & string> = {
  organization: "organizationId",
  branch: "branchId",
  season: "seasonId",
};

/** Maps a scope dimension to the API filter field (snake_case column). */
const DIMENSION_COLUMN: Record<ScopeDimension, string> = {
  organization: "organization_id",
  branch: "branch_id",
  season: "season_id",
};

/**
 * Builds equality filters for the given scope dimensions using the active scope.
 * Dimensions whose active id is `null` are skipped (no filter).
 *
 * @param scope - The active working scope.
 * @param scopedBy - The dimensions the resource is scoped by (from `meta.scopedBy`).
 * @returns Refine equality filters, suitable for `filters.permanent`.
 */
export function buildScopeFilters(
  scope: ActiveScope,
  scopedBy: ScopeDimension[] | undefined,
): CrudFilter[] {
  if (!scopedBy || scopedBy.length === 0) {
    return [];
  }

  return scopedBy.reduce<CrudFilter[]>((filters, dimension) => {
    const value = scope[DIMENSION_FIELD[dimension]];

    if (value) {
      filters.push({ field: DIMENSION_COLUMN[dimension], operator: "eq", value });
    }

    return filters;
  }, []);
}
