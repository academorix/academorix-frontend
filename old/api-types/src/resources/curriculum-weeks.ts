/**
 * curriculum-weeks.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in curriculum-weeks.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CurriculumWeekId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CurriculumWeek = z
  .object({
    id: CurriculumWeekId,
    tenant_id: TenantId,
    curriculum_id: z.string(),
    week_number: z.number(),
    starts_on: z.enum([
      "2025-09-08",
      "2025-09-15",
      "2025-09-22",
      "2025-09-29",
      "2025-10-06",
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
    ]),
    ends_on: z.enum([
      "2025-09-14",
      "2025-09-21",
      "2025-09-28",
      "2025-10-05",
      "2025-10-12",
      "2026-09-13",
      "2026-09-20",
      "2026-09-27",
    ]),
    theme: z.string(),
    objectives: z.array(z.string()),
    session_plan_ids: z.array(z.string()),
    notes: z.string().nullable(),
    status: z.enum(["completed", "in_progress", "planned", "skipped"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type CurriculumWeek = z.infer<typeof CurriculumWeek>;

export const { array: CurriculumWeekList, parse: parseCurriculumWeeksJson } =
  collectionHelpers(CurriculumWeek);
