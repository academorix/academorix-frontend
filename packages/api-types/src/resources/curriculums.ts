/**
 * curriculums.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in curriculums.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { SeasonId, StaffId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Curriculum = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    sport_key: SportKey.nullable(),
    team_id: TeamId.nullable(),
    season_id: SeasonId,
    name: z.string(),
    description: z.string(),
    total_weeks: z.number(),
    status: z.enum(["active", "draft"]),
    weeks: z.array(z.record(z.string(), z.unknown()).loose()),
    created_by: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
    weeks_count: z.number().optional(),
    is_published: z.boolean().optional(),
    created_by_staff_id: StaffId.nullable().optional(),
    for_staff: z.boolean().optional(),
    linked_pathway_id: z.string().optional(),
  })
  .loose();
export type Curriculum = z.infer<typeof Curriculum>;

export const { array: CurriculumList, parse: parseCurriculumsJson } = collectionHelpers(Curriculum);
