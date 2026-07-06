/**
 * sessions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in sessions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SessionId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Session = z
  .object({
    id: SessionId,
    tenant_id: TenantId,
    user_id: UserId,
    device_label: z.string(),
    ip: z.enum(["198.51.100.11", "198.51.100.44", "203.0.113.24", "203.0.113.55", "203.0.113.98"]),
    ua: z.string(),
    location_city: z.string(),
    location_country: z.enum(["US"]),
    last_seen_at: Timestamp,
    revoked_at: Timestamp.nullable(),
    created_at: Timestamp,
  })
  .loose();
export type Session = z.infer<typeof Session>;

export const { array: SessionList, parse: parseSessionsJson } = collectionHelpers(Session);
