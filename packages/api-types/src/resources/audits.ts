/**
 * audits.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in audits.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { AuditEntryId, ErasureRequestId, RetentionPolicyId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Audit = z
  .object({
    id: AuditEntryId,
    tenant_id: TenantId.nullable(),
    actor_id: z
      .enum([
        "system",
        "usr_admin",
        "usr_finance_omar",
        "usr_guardian_emma",
        "usr_medical_nadia",
        "usr_owner",
        "usr_platform_oncall",
        "usr_platform_ops",
        "usr_platform_support",
        "usr_reception_amy",
      ])
      .nullable(),
    actor_type: z.enum(["anonymous", "platform_user", "system", "user"]),
    action: z.string(),
    entity_type: z.string(),
    entity_id: z.string(),
    before: z.record(z.string(), z.unknown()).nullable(),
    after: z.record(z.string(), z.unknown()).nullable(),
    at: z.string(),
    ip: z
      .enum([
        "192.0.2.240",
        "198.51.100.201",
        "198.51.100.44",
        "203.0.113.10",
        "203.0.113.11",
        "203.0.113.24",
        "203.0.113.44",
        "203.0.113.55",
        "203.0.113.60",
      ])
      .nullable(),
    ua: z.string(),
    retention_policy_id: RetentionPolicyId.optional(),
    erasure_request_id: ErasureRequestId.optional(),
    notes: z.string().optional(),
  })
  .loose();
export type Audit = z.infer<typeof Audit>;

export const { array: AuditList, parse: parseAuditsJson } = collectionHelpers(Audit);
