/**
 * age-cutoff-rules.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in age-cutoff-rules.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { AgeCutoffRuleId, AgeGroupId, SeasonId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AgeCutoffRule = z
  .object({
    id: AgeCutoffRuleId,
    tenant_id: TenantId,
    season_id: SeasonId,
    age_group_id: AgeGroupId,
    sport_key: SportKey,
    cutoff_date: DateOnly,
    min_age: z.number(),
    max_age: z.number(),
    notes: z.string(),
    active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type AgeCutoffRule = z.infer<typeof AgeCutoffRule>;

export const { array: AgeCutoffRuleList, parse: parseAgeCutoffRulesJson } =
  collectionHelpers(AgeCutoffRule);
