/**
 * @file use-attribute-set.ts
 * @module lib/attributes/use-attribute-set
 *
 * @description
 * Loads the {@link AttributeSet} bound to an entity type + discriminator value
 * (e.g. `athlete_enrollment` + `sport_key="football"`) via the data provider
 * (`attribute-sets` resource), so it works identically under the mock and REST
 * providers. When multiple versions match, the highest version wins.
 */

import { useList } from "@refinedev/core";

import type { AttributeSet } from "@/types";

/** Arguments identifying which attribute set to load. */
interface UseAttributeSetArgs {
  /** Host entity type, e.g. `"athlete_enrollment"`. */
  entityType: string;
  /** Discriminator value selecting the set, e.g. `"football"`. */
  discriminatorValue: string | null | undefined;
}

/** The result of {@link useAttributeSet}. */
interface UseAttributeSetResult {
  /** The resolved set (highest matching version), or `undefined`. */
  set?: AttributeSet;
  /** Whether the set is still loading. */
  isLoading: boolean;
}

/**
 * Fetches and resolves the attribute set for the given entity + discriminator.
 * The query is disabled until a discriminator value is known (e.g. the sport
 * hasn't been chosen yet), so no wasted request fires.
 *
 * @param args - The entity type and discriminator value.
 */
export function useAttributeSet({
  entityType,
  discriminatorValue,
}: UseAttributeSetArgs): UseAttributeSetResult {
  const { result, query } = useList<AttributeSet>({
    resource: "attribute-sets",
    pagination: { mode: "off" },
    filters: [
      { field: "entity_type", operator: "eq", value: entityType },
      { field: "discriminator_value", operator: "eq", value: discriminatorValue },
    ],
    queryOptions: { enabled: Boolean(discriminatorValue) },
  });

  // Pick the highest-version match so historic sets don't shadow the current one.
  const set = (result?.data ?? []).reduce<AttributeSet | undefined>((latest, candidate) => {
    if (!latest || candidate.version > latest.version) {
      return candidate;
    }

    return latest;
  }, undefined);

  return { set, isLoading: query.isLoading };
}
