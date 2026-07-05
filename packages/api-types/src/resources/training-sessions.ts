/**
 * training-sessions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in training-sessions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey, TrainingSessionStatus } from "../enums.js";
import {
  BranchId,
  EventId,
  FacilityId,
  OrganizationId,
  SeasonId,
  StaffId,
  TeamId,
  TenantId,
  TrainingSessionId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TrainingSession = z
  .object({
    id: TrainingSessionId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId,
    season_id: SeasonId,
    event_id: EventId.nullable(),
    sport_key: SportKey,
    title: z.string(),
    starts_at: Timestamp,
    ends_at: Timestamp,
    duration_minutes: z.number(),
    status: TrainingSessionStatus,
    coach_id: StaffId,
    assistant_coach_ids: z.array(z.string()),
    focus: z.string(),
    session_plan_id: z.string().nullable(),
    recurrence_rule: z.string().nullable(),
    is_recurring: z.boolean(),
    resource_id: FacilityId,
    weather_cancelled: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type TrainingSession = z.infer<typeof TrainingSession>;

export const { array: TrainingSessionList, parse: parseTrainingSessionsJson } =
  collectionHelpers(TrainingSession);
