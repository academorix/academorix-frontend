/**
 * registration-windows.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in registration-windows.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { RegistrationWindowStatus } from "../enums.js";
import { RegistrationWindowId, SeasonId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const RegistrationWindow = z
  .object({
    id: RegistrationWindowId,
    tenant_id: TenantId,
    season_id: SeasonId,
    name: z.string(),
    opens_at: Timestamp,
    closes_at: Timestamp,
    status: RegistrationWindowStatus,
    capacity_by_program: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type RegistrationWindow = z.infer<typeof RegistrationWindow>;

export const { array: RegistrationWindowList, parse: parseRegistrationWindowsJson } =
  collectionHelpers(RegistrationWindow);
