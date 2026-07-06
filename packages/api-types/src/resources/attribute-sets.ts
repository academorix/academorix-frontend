/**
 * attribute-sets.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in attribute-sets.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AttributeSet = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    code: z.string(),
    entity_type: z.enum(["athlete_enrollment", "performance", "progress"]),
    discriminator_field: z.string(),
    discriminator_value: z.enum(["football", "swimming"]),
    version: z.number(),
    status: z.enum(["active"]),
    created_at: Timestamp,
    updated_at: Timestamp,
    groups: z.array(z.record(z.string(), z.unknown())),
  })
  .loose();
export type AttributeSet = z.infer<typeof AttributeSet>;

export const { array: AttributeSetList, parse: parseAttributeSetsJson } =
  collectionHelpers(AttributeSet);
