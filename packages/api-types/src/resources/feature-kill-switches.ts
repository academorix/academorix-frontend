/**
 * feature-kill-switches.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in feature-kill-switches.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";

import { collectionHelpers } from "./_helpers.js";

export const FeatureKillSwitche = z
  .object({
    id: z.string(),
    feature: z.string(),
    enabled: z.boolean(),
    reason: z.string().nullable(),
    updated_by: z.string(),
    updated_at: Timestamp,
    created_at: Timestamp,
  })
  .loose();
export type FeatureKillSwitche = z.infer<typeof FeatureKillSwitche>;

export const { array: FeatureKillSwitcheList, parse: parseFeatureKillSwitchesJson } =
  collectionHelpers(FeatureKillSwitche);
