/**
 * athletes.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in athletes.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { AthleteStatus } from "../enums.js";
import { AthleteId, BranchId, ErasureRequestId, OrganizationId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Athlete = z
  .object({
    id: AthleteId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    person_identity_id: z.string().nullable(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    avatar_url: z.unknown().nullable(),
    status: AthleteStatus,
    branch_id: BranchId,
    primary_guardian_user_id: UserId,
    date_of_birth: DateOnly,
    gender: z.enum(["female", "male"]),
    nationality: z.enum(["BR", "ES", "IN", "KR", "MX", "NG", "US"]),
    national_id: z.unknown().nullable(),
    preferred_language: z.enum(["en"]),
    enrolled_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    anonymized: z.boolean().optional(),
    anonymized_at: Timestamp.optional(),
    anonymized_by_erasure_request_id: ErasureRequestId.optional(),
    retained_reason: z.string().optional(),
    notes: z.string().optional(),
  })
  .loose();
export type Athlete = z.infer<typeof Athlete>;

export const { array: AthleteList, parse: parseAthletesJson } = collectionHelpers(Athlete);
