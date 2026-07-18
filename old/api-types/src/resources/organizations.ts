/**
 * organizations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in organizations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { OrganizationId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Organization = z
  .object({
    id: OrganizationId,
    tenant_id: TenantId,
    parent_id: z.unknown().nullable(),
    name: z.string(),
    slug: z.enum(["downtown-division", "harbor-main", "riverside-main"]),
    is_default: z.boolean(),
    status: z.enum(["active"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Organization = z.infer<typeof Organization>;

export const { array: OrganizationList, parse: parseOrganizationsJson } =
  collectionHelpers(Organization);
