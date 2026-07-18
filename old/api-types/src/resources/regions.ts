/**
 * regions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in regions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { RegionId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Region = z
  .object({
    id: RegionId,
    tenant_id: TenantId,
    name: z.string(),
    currency_code: z.enum(["AED", "USD"]),
    countries: z.array(z.string()),
    timezone: z.enum(["America/New_York", "Asia/Dubai"]),
    locale: z.enum(["ar", "en"]),
    tax_config: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Region = z.infer<typeof Region>;

export const { array: RegionList, parse: parseRegionsJson } = collectionHelpers(Region);
