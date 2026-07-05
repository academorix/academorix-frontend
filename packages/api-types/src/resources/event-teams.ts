/**
 * event-teams.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in event-teams.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { EventId, EventTeamId, TeamId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const EventTeam = z
  .object({
    event_id: EventId,
    team_id: TeamId,
    is_primary: z.boolean(),
    ordering: z.number(),
    id: EventTeamId.optional(),
    team_display_name: z.string().optional(),
    is_home: z.boolean().optional(),
    arrival_time: z.enum(["2026-07-20T09:15:00Z"]).optional(),
    created_at: Timestamp.optional(),
  })
  .loose();
export type EventTeam = z.infer<typeof EventTeam>;

export const { array: EventTeamList, parse: parseEventTeamsJson } = collectionHelpers(EventTeam);
