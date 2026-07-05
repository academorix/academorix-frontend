/**
 * opponent-logos.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in opponent-logos.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { OpponentLogoId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const OpponentLogo = z
  .object({
    id: OpponentLogoId,
    tenant_id: TenantId,
    key: z.enum([
      "eastside-eagles",
      "harbor-fc",
      "meadowbrook-fc",
      "riverside-fc",
      "rovers-fc",
      "united-youth",
    ]),
    display_name: z.string(),
    logo_url: z.string().nullable(),
    primary_color: z.enum(["#0369A1", "#059669", "#0EA5E9", "#111827", "#1E3A8A", "#B91C1C"]),
    secondary_color: z.enum(["#0F172A", "#F59E0B", "#F97316", "#FBBF24", "#FFFFFF"]).nullable(),
    sport_key: SportKey,
    usage_count: z.number(),
    first_seen_at: Timestamp,
    last_used_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type OpponentLogo = z.infer<typeof OpponentLogo>;

export const { array: OpponentLogoList, parse: parseOpponentLogosJson } =
  collectionHelpers(OpponentLogo);
