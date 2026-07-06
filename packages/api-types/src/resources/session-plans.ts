/**
 * session-plans.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in session-plans.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { BranchId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SessionPlan = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    sport_key: SportKey,
    name: z.string(),
    description: z.string(),
    duration_minutes: z.number(),
    level: z.enum(["advanced", "beginner", "intermediate"]),
    objectives: z.array(z.string()),
    equipment: z.array(z.string()),
    items: z.array(z.record(z.string(), z.unknown()).loose()),
    created_by: z.string(),
    curriculum_id: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    team_id: TeamId.nullable().optional(),
    scheduled_for: z
      .enum([
        "2026-07-03T17:00:00Z",
        "2026-07-06T16:00:00Z",
        "2026-07-08T17:00:00Z",
        "2026-07-09T16:00:00Z",
        "2026-09-08T16:00:00Z",
        "2026-09-16T16:00:00Z",
      ])
      .optional(),
    branch_id: BranchId.optional(),
  })
  .loose();
export type SessionPlan = z.infer<typeof SessionPlan>;

export const { array: SessionPlanList, parse: parseSessionPlansJson } =
  collectionHelpers(SessionPlan);
