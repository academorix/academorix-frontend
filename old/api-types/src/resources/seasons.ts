/**
 * seasons.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in seasons.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { SeasonStatus } from "../enums.js";
import { OrganizationId, RegistrationWindowId, SeasonId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Season = z
  .object({
    id: SeasonId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    name: z.string(),
    slug: z.enum(["2024-25", "2025-26", "2026-27", "harbor-2025-26"]),
    status: SeasonStatus,
    start_date: DateOnly,
    end_date: DateOnly,
    is_current: z.boolean(),
    age_cutoff_date: DateOnly,
    registration_window_id: RegistrationWindowId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Season = z.infer<typeof Season>;

export const { array: SeasonList, parse: parseSeasonsJson } = collectionHelpers(Season);
