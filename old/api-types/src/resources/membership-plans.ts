/**
 * membership-plans.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in membership-plans.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { MembershipPlanId, RegionId, SportId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const MembershipPlan = z
  .object({
    id: MembershipPlanId,
    tenant_id: TenantId,
    region_id: RegionId.nullable(),
    sport_id: SportId.nullable(),
    key: z.string(),
    name: z.record(z.string(), z.unknown()),
    cadence: z.enum(["monthly", "termly"]),
    price_minor: z.number(),
    currency: z.enum(["USD"]),
    trial_days: z.number(),
    features_json: z.record(z.string(), z.unknown()),
    is_active: z.boolean(),
    version: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type MembershipPlan = z.infer<typeof MembershipPlan>;

export const { array: MembershipPlanList, parse: parseMembershipPlansJson } =
  collectionHelpers(MembershipPlan);
