/**
 * facilities.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in facilities.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BranchId, FacilityId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Facilitie = z
  .object({
    id: FacilityId,
    tenant_id: TenantId,
    branch_id: BranchId,
    type: z.enum(["court", "equipment", "pitch", "pool"]),
    name: z.string(),
    feature_flag: z.enum(["facilities"]),
    capacity: z.number().nullable(),
    opening_hours: z.record(z.string(), z.unknown()).nullable(),
    hourly_cost_minor: z.number(),
    currency: z.enum(["USD"]),
    is_active: z.boolean(),
    _note: z.string().optional(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Facilitie = z.infer<typeof Facilitie>;

export const { array: FacilitieList, parse: parseFacilitiesJson } = collectionHelpers(Facilitie);
