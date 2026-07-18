/**
 * entitlement-licenses.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in entitlement-licenses.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { EntitlementKind, EntitlementLicenseStatus } from "../enums.js";
import { PlanTierId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const EntitlementLicense = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    plan_id: PlanTierId,
    plan_key: z.enum(["pro"]),
    entitlement_type: z.enum([
      "AiTokens",
      "AthleteSlot",
      "BranchSlot",
      "FeatureAdvancedReporting",
      "FeatureAi",
      "FeatureFacilityBooking",
      "FeatureWhiteLabel",
      "OrganizationSlot",
      "SmsCredits",
      "StaffSeat",
      "StorageBytes",
      "TeamSlot",
    ]),
    kind: EntitlementKind,
    slot_limit: z.number().nullable(),
    slot_used: z.number().nullable(),
    pool_granted: z.number().nullable(),
    pool_used: z.number().nullable(),
    expires_at: Timestamp,
    status: EntitlementLicenseStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
    exhausted_at: Timestamp.optional(),
    notes: z.string().optional(),
  })
  .loose();
export type EntitlementLicense = z.infer<typeof EntitlementLicense>;

export const { array: EntitlementLicenseList, parse: parseEntitlementLicensesJson } =
  collectionHelpers(EntitlementLicense);
