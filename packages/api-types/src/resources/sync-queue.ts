/**
 * sync-queue.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in sync-queue.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SyncQueueStatus } from "../enums.js";
import { TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SyncQueue = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    device_id: z.string(),
    entity: z.enum(["attendance", "checkin_log", "progress", "registrations"]),
    entity_ids: z.array(z.string()),
    direction: z.enum(["push"]),
    status: SyncQueueStatus,
    summary: z.string(),
    captured_at: Timestamp,
    synced_at: Timestamp.nullable(),
    captured_by: z.string(),
    captured_by_user_id: UserId.nullable(),
    retry_count: z.number(),
    last_error: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type SyncQueue = z.infer<typeof SyncQueue>;

export const { array: SyncQueueList, parse: parseSyncQueueJson } = collectionHelpers(SyncQueue);
