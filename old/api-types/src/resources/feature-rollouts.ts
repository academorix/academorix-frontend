/**
 * feature-rollouts.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in feature-rollouts.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";

import { collectionHelpers } from "./_helpers.js";

export const FeatureRollout = z
  .object({
    id: z.string(),
    feature: z.enum(["ai", "ai_agent_beta", "family_view_v2", "offline_attendance"]),
    mode: z.enum(["explicit", "percentage"]),
    percentage: z.number().nullable(),
    cohort: z.array(z.string()).nullable(),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type FeatureRollout = z.infer<typeof FeatureRollout>;

export const { array: FeatureRolloutList, parse: parseFeatureRolloutsJson } =
  collectionHelpers(FeatureRollout);
