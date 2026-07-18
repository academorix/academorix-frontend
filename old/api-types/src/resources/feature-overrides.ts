/**
 * feature-overrides.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in feature-overrides.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const FeatureOverride = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    feature: z.enum(["advanced_reporting", "ai", "white_label"]),
    decision: z.enum(["allow", "deny"]),
    reason: z.string(),
    expires_at: Timestamp.nullable(),
    created_by: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type FeatureOverride = z.infer<typeof FeatureOverride>;

export const { array: FeatureOverrideList, parse: parseFeatureOverridesJson } =
  collectionHelpers(FeatureOverride);
