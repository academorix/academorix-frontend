/**
 * sync-conflicts.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in sync-conflicts.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SyncConflict = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    entity: z.enum(["attendance", "checkin_log", "progress"]),
    entity_id: z.string(),
    device_id: z.string(),
    conflict_type: z.string(),
    server_value: z.record(z.string(), z.unknown()).nullable(),
    client_value: z.record(z.string(), z.unknown()),
    resolution_strategy: z.enum(["last_write_wins", "manual"]),
    resolution: z.enum(["client_won", "merged", "pending"]),
    resolved_at: Timestamp.nullable(),
    resolved_by: z.enum(["system"]).nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
  })
  .loose();
export type SyncConflict = z.infer<typeof SyncConflict>;

export const { array: SyncConflictList, parse: parseSyncConflictsJson } =
  collectionHelpers(SyncConflict);
