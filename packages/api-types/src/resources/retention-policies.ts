/**
 * retention-policies.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in retention-policies.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { RetentionPolicyId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const RetentionPolicie = z
  .object({
    id: RetentionPolicyId,
    tenant_id: TenantId.nullable(),
    data_class: z.enum([
      "athlete_records",
      "audit_entries",
      "medical_records",
      "messages",
      "safeguarding_incidents",
    ]),
    retention_days: z.number().nullable(),
    redaction_strategy: z.enum(["anonymize", "hard_delete", "hold", "redact"]),
    applies_to_tables: z.array(z.string()),
    active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type RetentionPolicie = z.infer<typeof RetentionPolicie>;

export const { array: RetentionPolicieList, parse: parseRetentionPoliciesJson } =
  collectionHelpers(RetentionPolicie);
