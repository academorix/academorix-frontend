/**
 * age-groups.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in age-groups.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AgeGroupId, BranchId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AgeGroup = z
  .object({
    id: AgeGroupId,
    tenant_id: TenantId,
    branch_id: BranchId,
    key: z.enum(["U10", "U12", "U14", "U16", "U18", "U8"]),
    min_age: z.number(),
    max_age: z.number(),
    sort_order: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type AgeGroup = z.infer<typeof AgeGroup>;

export const { array: AgeGroupList, parse: parseAgeGroupsJson } = collectionHelpers(AgeGroup);
