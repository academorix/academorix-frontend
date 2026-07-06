/**
 * goals.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in goals.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { Priority, SportKey } from "../enums.js";
import {
  AthleteEnrollmentId,
  AthleteId,
  DevelopmentGoalId,
  PathwayStageId,
  StaffId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Goal = z
  .object({
    id: DevelopmentGoalId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    enrollment_id: AthleteEnrollmentId.nullable(),
    sport_key: SportKey,
    goal: z.string(),
    category: z.enum(["mental", "physical", "technical"]),
    priority: Priority,
    status: z.enum(["achieved", "active", "paused"]),
    target_date: DateOnly.nullable(),
    progress_percent: z.number(),
    coach_id: StaffId,
    pathway_stage_id: PathwayStageId.nullable(),
    note: z.string(),
    reviewed_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Goal = z.infer<typeof Goal>;

export const { array: GoalList, parse: parseGoalsJson } = collectionHelpers(Goal);
