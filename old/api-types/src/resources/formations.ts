/**
 * formations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in formations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { BranchId, FormationId, OrganizationId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Formation = z
  .object({
    id: FormationId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    sport_key: SportKey,
    team_id: TeamId.nullable(),
    name: z.string(),
    shape: z.enum(["1-5", "2-2", "2-3-1", "3-5-2", "4-3-3", "4-4-2", "5-4", "relay-4"]),
    note: z.string(),
    slots: z.array(z.record(z.string(), z.unknown())),
    created_at: Timestamp,
    updated_at: Timestamp,
    field_type: z.string().optional(),
  })
  .loose();
export type Formation = z.infer<typeof Formation>;

export const { array: FormationList, parse: parseFormationsJson } = collectionHelpers(Formation);
