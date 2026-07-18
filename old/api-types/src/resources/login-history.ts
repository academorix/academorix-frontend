/**
 * login-history.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in login-history.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const LoginHistory = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    user_id: UserId,
    email: z.enum([
      "admin@academorix.test",
      "finance@academorix.test",
      "mike.turner@example.com",
      "owner@academorix.test",
    ]),
    ip: z.enum(["192.0.2.240", "198.51.100.11", "203.0.113.24", "203.0.113.44", "203.0.113.55"]),
    ua: z.string(),
    location_city: z.string(),
    location_country: z.enum(["??", "US"]),
    result: z.enum(["failed", "success"]),
    risk_score: z.number(),
    reason: z.string().nullable(),
    at: z.enum([
      "2026-06-20T02:14:00Z",
      "2026-06-20T02:14:12Z",
      "2026-06-20T02:15:00Z",
      "2026-06-28T16:00:00Z",
      "2026-06-29T14:00:00Z",
      "2026-06-29T18:00:00Z",
      "2026-06-30T08:15:00Z",
    ]),
  })
  .loose();
export type LoginHistory = z.infer<typeof LoginHistory>;

export const { array: LoginHistoryList, parse: parseLoginHistoryJson } =
  collectionHelpers(LoginHistory);
