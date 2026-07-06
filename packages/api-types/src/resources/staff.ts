/**
 * staff.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in staff.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { StaffStatus } from "../enums.js";
import { BranchId, OrganizationId, PersonIdentityId, StaffId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Staff = z
  .object({
    id: StaffId,
    tenant_id: TenantId,
    user_id: UserId,
    person_identity_id: PersonIdentityId.nullable(),
    organization_id: OrganizationId,
    branch_id: BranchId,
    first_name: z.enum(["Amy", "Jordan", "Marco", "Mike", "Nadia", "Sara"]),
    last_name: z.enum(["Blake", "Farouk", "Ferrari", "Lopez", "Nolan", "Turner"]),
    email: z.string(),
    phone: z.string(),
    avatar_url: z.unknown().nullable(),
    title: z.string(),
    employment_type: z.enum(["hourly", "per_session", "salaried"]),
    base_pay_minor: z.number(),
    pay_period: z.enum(["hourly", "monthly", "per_session"]),
    currency: z.enum(["AED", "USD"]),
    status: StaffStatus,
    hired_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Staff = z.infer<typeof Staff>;

export const { array: StaffList, parse: parseStaffJson } = collectionHelpers(Staff);
