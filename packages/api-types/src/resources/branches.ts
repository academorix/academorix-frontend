/**
 * branches.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in branches.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BranchId, OrganizationId, RegionId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Branche = z
  .object({
    id: BranchId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    region_id: RegionId.nullable(),
    name: z.string(),
    slug: z.enum(["downtown-arena", "harbor-marina", "marina-center", "riverside-hq"]),
    status: z.enum(["active"]),
    address_line: z.string(),
    city: z.string(),
    country: z.enum(["US"]),
    timezone: z.enum(["America/Los_Angeles", "America/New_York"]),
    capacity: z.number(),
    contact_email: z.enum([
      "downtown@riverside.test",
      "hq@riverside.test",
      "marina@harbor.test",
      "marina@riverside.test",
    ]),
    contact_phone: z.string(),
    is_default: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Branche = z.infer<typeof Branche>;

export const { array: BrancheList, parse: parseBranchesJson } = collectionHelpers(Branche);
