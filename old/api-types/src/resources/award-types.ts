/**
 * award-types.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in award-types.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AwardType = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    key: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.enum(["competition", "development", "match", "recognition"]),
    auto_grant_from_event: z.string().nullable(),
    certificate_template_key: z.string(),
    icon_key: z.enum(["certificate", "cup", "medal", "star", "trophy"]),
    is_active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type AwardType = z.infer<typeof AwardType>;

export const { array: AwardTypeList, parse: parseAwardTypesJson } = collectionHelpers(AwardType);
