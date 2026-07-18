/**
 * policy-acknowledgements.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in policy-acknowledgements.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PolicyAckStatus } from "../enums.js";
import { PolicyAcknowledgementId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PolicyAcknowledgement = z
  .object({
    id: PolicyAcknowledgementId,
    tenant_id: TenantId,
    user_id: UserId,
    policy_key: z.string(),
    policy_version: z.enum(["v1", "v2", "v3"]),
    status: PolicyAckStatus,
    acknowledged_at: Timestamp.nullable(),
    overdue_since: z.enum(["2026-05-15T00:00:00Z"]).nullable(),
    document_id: z.unknown().nullable(),
    ip_address: z
      .enum(["203.0.113.42", "203.0.113.51", "203.0.113.60", "203.0.113.71", "203.0.113.99"])
      .nullable(),
    user_agent: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type PolicyAcknowledgement = z.infer<typeof PolicyAcknowledgement>;

export const { array: PolicyAcknowledgementList, parse: parsePolicyAcknowledgementsJson } =
  collectionHelpers(PolicyAcknowledgement);
