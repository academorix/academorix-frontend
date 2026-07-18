/**
 * packs.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in packs.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { RegionId, SessionPackId, SportId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Pack = z
  .object({
    id: SessionPackId,
    tenant_id: TenantId,
    region_id: RegionId,
    sport_id: SportId.nullable(),
    sport_key: SportKey.nullable(),
    key: z.enum([
      "private-football-10",
      "private-football-5",
      "private-multi-5",
      "private-swim-10",
    ]),
    name: z.record(z.string(), z.unknown()),
    description: z.string(),
    session_count: z.number(),
    session_duration_minutes: z.number(),
    price_minor: z.number(),
    currency: z.enum(["USD"]),
    unit_credit_minor: z.number(),
    validity_days: z.number(),
    eligible_coach_ids: z.array(z.string()),
    is_active: z.boolean(),
    version: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Pack = z.infer<typeof Pack>;

export const { array: PackList, parse: parsePacksJson } = collectionHelpers(Pack);
