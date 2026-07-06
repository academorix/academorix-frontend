/**
 * private-sessions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in private-sessions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PrivateSessionStatus, SportKey } from "../enums.js";
import {
  AthleteId,
  BranchId,
  FacilityId,
  InvoiceId,
  OrganizationId,
  PrivateSessionId,
  SeasonId,
  SessionCreditId,
  StaffId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PrivateSession = z
  .object({
    id: PrivateSessionId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    season_id: SeasonId,
    coach_id: StaffId,
    athlete_id: AthleteId,
    sport_key: SportKey,
    starts_at: Timestamp,
    ends_at: Timestamp,
    duration_minutes: z.number(),
    status: PrivateSessionStatus,
    price_minor: z.number(),
    currency: z.enum(["USD"]),
    resource_id: FacilityId,
    invoice_id: InvoiceId.nullable(),
    session_credit_id: SessionCreditId.nullable(),
    requested_at: Timestamp,
    approved_at: Timestamp,
    cancelled_at: z.unknown().nullable(),
    cancellation_reason: z.unknown().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type PrivateSession = z.infer<typeof PrivateSession>;

export const { array: PrivateSessionList, parse: parsePrivateSessionsJson } =
  collectionHelpers(PrivateSession);
