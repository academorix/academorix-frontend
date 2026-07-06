/**
 * pathway-stages.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in pathway-stages.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PathwayStageId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PathwayStage = z
  .object({
    id: PathwayStageId,
    tenant_id: TenantId,
    pathway_id: z.string(),
    key: z.enum([
      "advanced_tactics",
      "elite",
      "foundation",
      "junior",
      "junior_squad",
      "learn_to_swim",
      "mentor_cert",
      "pre_academy",
      "safeguarding_refresh",
      "senior",
      "senior_squad",
      "youth_development",
    ]),
    name: z.string(),
    description: z.string(),
    order: z.number(),
    promotion_criteria: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
    for_staff: z.boolean().optional(),
  })
  .loose();
export type PathwayStage = z.infer<typeof PathwayStage>;

export const { array: PathwayStageList, parse: parsePathwayStagesJson } =
  collectionHelpers(PathwayStage);
