/**
 * demo-users.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in demo-users.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PersonIdentityId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const DemoUser = z
  .object({
    id: UserId,
    tenant_id: TenantId,
    person_identity_id: PersonIdentityId.nullable(),
    email: z.enum([
      "admin@academorix.test",
      "amy.lopez@example.com",
      "finance@academorix.test",
      "medical@academorix.test",
      "mike.turner@example.com",
      "owner@academorix.test",
      "sara.nolan@example.com",
    ]),
    username: z.enum(["admin", "amy", "finance_omar", "medical_nadia", "mike", "owner", "sara"]),
    phone: z.string(),
    status: z.enum(["active"]),
    email_verified_at: Timestamp,
    phone_verified_at: Timestamp.nullable(),
    last_login_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    profile: z.record(z.string(), z.unknown()),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    grants: z.array(z.record(z.string(), z.unknown())),
    features: z.array(z.string()),
    entitlements: z.record(z.string(), z.unknown()),
    terminology: z.record(z.string(), z.unknown()),
    tenant: z.record(z.string(), z.unknown()),
    tenants: z.array(z.record(z.string(), z.unknown())),
    scopes: z.record(z.string(), z.unknown()),
  })
  .loose();
export type DemoUser = z.infer<typeof DemoUser>;

export const { array: DemoUserList, parse: parseDemoUsersJson } = collectionHelpers(DemoUser);
