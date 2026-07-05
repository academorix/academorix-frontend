/**
 * development-pathways.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in development-pathways.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { OrganizationId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const DevelopmentPathway = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    organization_id: OrganizationId,
    sport_key: SportKey.nullable(),
    name: z.string(),
    description: z.string(),
    stages_count: z.number(),
    is_active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
    for_athletes: z.boolean().optional(),
    for_staff: z.boolean().optional(),
    archived_at: Timestamp.optional(),
  })
  .loose();
export type DevelopmentPathway = z.infer<typeof DevelopmentPathway>;

export const { array: DevelopmentPathwayList, parse: parseDevelopmentPathwaysJson } =
  collectionHelpers(DevelopmentPathway);
