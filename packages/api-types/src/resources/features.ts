/**
 * features.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in features.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { collectionHelpers } from "./_helpers.js";

export const Feature = z
  .object({
    feature: z.enum([
      "advanced_reporting",
      "ai",
      "api_access",
      "competitions",
      "facility_booking",
      "family_view_v2",
      "offline_attendance",
      "offline_sync_v2",
      "public_signup",
      "white_label",
    ]),
    enabled: z.boolean(),
    source: z.enum(["entitlement", "kill_switch", "override", "rollout"]),
    license_id: z.string().nullable().optional(),
    notes: z.string(),
    override_id: z.string().optional(),
    rollout_id: z.string().optional(),
    kill_switch_id: z.string().optional(),
  })
  .loose();
export type Feature = z.infer<typeof Feature>;

export const { array: FeatureList, parse: parseFeaturesJson } = collectionHelpers(Feature);
