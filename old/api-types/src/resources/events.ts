/**
 * events.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in events.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { EventStatus, EventType, SportKey } from "../enums.js";
import {
  BranchId,
  EventId,
  FacilityId,
  OrganizationId,
  SeasonId,
  TeamId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Event = z
  .object({
    id: EventId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId.nullable(),
    season_id: SeasonId,
    sport_key: SportKey,
    title: z.string(),
    type: EventType,
    status: EventStatus,
    starts_at: Timestamp,
    ends_at: Timestamp,
    location: z.string(),
    resource_id: FacilityId,
    activity_ref: z.record(z.string(), z.unknown()).nullable(),
    is_public: z.boolean(),
    is_multi_team: z.boolean(),
    cancellation_reason: z.string().nullable(),
    rsvp_going: z.number(),
    rsvp_declined: z.number(),
    rsvp_pending: z.number(),
    rsvp_total: z.number(),
    created_by: z.string(),
    approved_by: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Event = z.infer<typeof Event>;

export const { array: EventList, parse: parseEventsJson } = collectionHelpers(Event);
