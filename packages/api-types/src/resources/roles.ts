/**
 * roles.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in roles.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { RoleId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Role = z
  .object({
    id: RoleId,
    tenant_id: TenantId,
    name: z.enum([
      "admin",
      "branch_manager",
      "coach",
      "finance",
      "head_coach",
      "medical",
      "owner",
      "parent_guardian",
      "reception",
      "viewer",
    ]),
    label: z.string(),
    description: z.string(),
    permissions: z.array(z.string()),
    is_system: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Role = z.infer<typeof Role>;

export const { array: RoleList, parse: parseRolesJson } = collectionHelpers(Role);
