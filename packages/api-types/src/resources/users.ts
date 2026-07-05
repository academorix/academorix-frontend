/**
 * users.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in users.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { UserStatus } from "../enums.js";
import { PersonIdentityId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const User = z
  .object({
    id: UserId,
    tenant_id: TenantId,
    person_identity_id: PersonIdentityId.nullable(),
    email: z.string(),
    username: z
      .enum([
        "admin",
        "amy",
        "finance_omar",
        "harbor_coach",
        "harbor_owner",
        "marco",
        "medical_nadia",
        "mike",
        "owner",
        "sara",
      ])
      .nullable(),
    first_name: z.string(),
    last_name: z.string(),
    avatar_url: z.unknown().nullable(),
    phone: z.string(),
    status: UserStatus,
    email_verified_at: Timestamp.nullable(),
    phone_verified_at: Timestamp.nullable(),
    roles: z.array(z.string()),
    last_login_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type User = z.infer<typeof User>;

export const { array: UserList, parse: parseUsersJson } = collectionHelpers(User);
