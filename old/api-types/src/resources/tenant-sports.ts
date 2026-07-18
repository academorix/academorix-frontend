/**
 * tenant-sports.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in tenant-sports.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId, TenantSportId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TenantSport = z
  .object({
    id: TenantSportId,
    tenant_id: TenantId,
    sport_key: z.enum(["basketball", "football", "karate", "swimming"]),
    is_enabled: z.boolean(),
    terminology_overrides: z.record(z.string(), z.unknown()),
    active_attribute_set_ids: z.array(z.string()),
    sort_order: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type TenantSport = z.infer<typeof TenantSport>;

export const { array: TenantSportList, parse: parseTenantSportsJson } =
  collectionHelpers(TenantSport);
