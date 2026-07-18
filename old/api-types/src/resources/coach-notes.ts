/**
 * coach-notes.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in coach-notes.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CoachNoteVisibility } from "../enums.js";
import { AthleteId, CoachNoteId, EventId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CoachNote = z
  .object({
    id: CoachNoteId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    coach_id: StaffId,
    body: z.string(),
    visibility: CoachNoteVisibility,
    related_event_id: EventId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type CoachNote = z.infer<typeof CoachNote>;

export const { array: CoachNoteList, parse: parseCoachNotesJson } = collectionHelpers(CoachNote);
