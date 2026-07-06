/**
 * safeguarding-incidents.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in safeguarding-incidents.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SafeguardingIncidentStatus } from "../enums.js";
import { AthleteId, BranchId, OrganizationId, SafeguardingIncidentId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SafeguardingIncident = z
  .object({
    id: SafeguardingIncidentId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    athlete_id: AthleteId.nullable(),
    category: z.enum(["facility_safety", "privacy", "welfare"]),
    severity: z.enum(["minor", "moderate"]),
    status: SafeguardingIncidentStatus,
    summary: z.string(),
    handler_id: z.string(),
    opened_at: Timestamp,
    reported_by: z.string(),
    restricted: z.boolean(),
    resolution_notes: z.string().nullable(),
    resolved_at: Timestamp.nullable(),
    policy_acknowledged: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type SafeguardingIncident = z.infer<typeof SafeguardingIncident>;

export const { array: SafeguardingIncidentList, parse: parseSafeguardingIncidentsJson } =
  collectionHelpers(SafeguardingIncident);
