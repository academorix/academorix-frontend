/**
 * grants.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in grants.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ScopeType } from "../enums.js";
import { GrantId, RoleId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Grant = z
  .object({
    id: GrantId,
    tenant_id: TenantId,
    user_id: UserId,
    role_id: RoleId,
    role_name: z.enum([
      "admin",
      "coach",
      "finance",
      "head_coach",
      "medical",
      "owner",
      "parent_guardian",
      "reception",
    ]),
    scope_type: ScopeType,
    scope_id: z.string(),
    expires_at: Timestamp.nullable(),
    granted_by: z.string(),
    granted_at: Timestamp,
  })
  .loose();
export type Grant = z.infer<typeof Grant>;

export const { array: GrantList, parse: parseGrantsJson } = collectionHelpers(Grant);
