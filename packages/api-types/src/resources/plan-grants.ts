/**
 * plan-grants.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in plan-grants.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { EntitlementKind } from "../enums.js";
import { PublicPageId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PlanGrant = z
  .object({
    id: PublicPageId,
    plan_key: z.enum(["enterprise", "growth", "pro", "starter"]),
    entitlement_type: z.enum([
      "AiTokens",
      "AthleteSlot",
      "BranchSlot",
      "FeatureAdvancedReporting",
      "FeatureAi",
      "FeatureApiAccess",
      "FeatureFacilityBooking",
      "FeatureWhiteLabel",
      "OrganizationSlot",
      "StaffSeat",
      "StorageBytes",
      "TeamSlot",
    ]),
    kind: EntitlementKind,
    limit: z.number().nullable(),
    meta: z.record(z.string(), z.unknown()).nullable(),
  })
  .loose();
export type PlanGrant = z.infer<typeof PlanGrant>;

export const { array: PlanGrantList, parse: parsePlanGrantsJson } = collectionHelpers(PlanGrant);
