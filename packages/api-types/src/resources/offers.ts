/**
 * offers.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in offers.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { OfferStatus } from "../enums.js";
import { OfferId, RegionId, SeasonId, TeamId, TenantId, WaitlistEntryId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Offer = z
  .object({
    id: OfferId,
    tenant_id: TenantId,
    waitlist_entry_id: WaitlistEntryId,
    registration_id: RegionId,
    season_id: SeasonId,
    team_id: TeamId,
    sent_at: Timestamp,
    expires_at: Timestamp,
    responded_at: Timestamp.nullable(),
    status: OfferStatus,
    response_note: z.string().nullable(),
    resulting_athlete_id: z.unknown().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Offer = z.infer<typeof Offer>;

export const { array: OfferList, parse: parseOffersJson } = collectionHelpers(Offer);
