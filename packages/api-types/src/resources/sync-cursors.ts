/**
 * sync-cursors.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in sync-cursors.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SyncCursor = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    device_id: z.string(),
    user_id: UserId.nullable(),
    entity: z.enum(["attendance", "checkin_log", "progress", "registrations"]),
    last_synced_at: Timestamp,
    last_cursor: z.enum([
      "att:2026-06-28T10:30:00Z",
      "att:2026-06-30T20:45:00Z",
      "att:2026-06-30T21:12:00Z",
      "chk:2026-07-06T17:35:00Z",
      "prg:2026-06-28T10:32:00Z",
      "prg:2026-06-30T21:12:00Z",
      "reg:2026-06-30T18:50:00Z",
    ]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type SyncCursor = z.infer<typeof SyncCursor>;

export const { array: SyncCursorList, parse: parseSyncCursorsJson } = collectionHelpers(SyncCursor);
