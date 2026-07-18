/**
 * session-credits.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in session-credits.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, SessionCreditId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SessionCredit = z
  .object({
    id: SessionCreditId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    delta: z.number(),
    source_type: z.enum(["adjustment", "pack_invoice", "private_session"]),
    source_id: z.string(),
    reason: z.string(),
    occurred_at: Timestamp,
  })
  .loose();
export type SessionCredit = z.infer<typeof SessionCredit>;

export const { array: SessionCreditList, parse: parseSessionCreditsJson } =
  collectionHelpers(SessionCredit);
