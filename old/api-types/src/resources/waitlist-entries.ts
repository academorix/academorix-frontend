/**
 * waitlist-entries.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in waitlist-entries.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { WaitlistStatus } from "../enums.js";
import { RegionId, SeasonId, TeamId, TenantId, WaitlistEntryId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const WaitlistEntrie = z
  .object({
    id: WaitlistEntryId,
    tenant_id: TenantId,
    registration_id: RegionId,
    athlete_name: z.string(),
    program_key: z.string(),
    season_id: SeasonId,
    team_id: TeamId,
    position: z.number(),
    status: WaitlistStatus,
    offered_at: Timestamp.nullable(),
    offer_expires_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type WaitlistEntrie = z.infer<typeof WaitlistEntrie>;

export const { array: WaitlistEntrieList, parse: parseWaitlistEntriesJson } =
  collectionHelpers(WaitlistEntrie);
