/**
 * memberships.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in memberships.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BillingPeriod, MembershipStatus } from "../enums.js";
import {
  AthleteId,
  BranchId,
  MembershipId,
  MembershipPlanId,
  OrganizationId,
  PaymentMethodId,
  RegionId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Membership = z
  .object({
    id: MembershipId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    region_id: RegionId.nullable(),
    athlete_id: AthleteId,
    payer_user_id: UserId,
    plan_id: MembershipPlanId,
    plan_version: z.number(),
    status: MembershipStatus,
    billing_period: BillingPeriod,
    current_period_starts_at: Timestamp,
    current_period_ends_at: Timestamp,
    next_bill_at: Timestamp.nullable(),
    default_payment_method_id: PaymentMethodId.nullable(),
    trial_ends_at: Timestamp.nullable(),
    paused_at: Timestamp.nullable(),
    resumed_from_status: z.unknown().nullable(),
    canceled_at: z.unknown().nullable(),
    cancel_reason: z.unknown().nullable(),
    cancel_at_period_end: z.boolean(),
    version: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Membership = z.infer<typeof Membership>;

export const { array: MembershipList, parse: parseMembershipsJson } = collectionHelpers(Membership);
