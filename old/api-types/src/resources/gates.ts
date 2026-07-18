/**
 * gates.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in gates.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { GateStatus } from "../enums.js";
import { BranchId, GateId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Gate = z
  .object({
    id: GateId,
    tenant_id: TenantId,
    branch_id: BranchId,
    label: z.string(),
    hardware_id: z
      .enum([
        "reader-downtown-002",
        "reader-downtown-003",
        "reader-marina-001",
        "reader-marina-002",
        "reader-marina-003",
        "reader-river-001",
        "reader-river-002",
        "reader-river-003",
        "reader-river-004",
      ])
      .nullable(),
    is_active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
    type: z.string().optional(),
    reader_model: z.enum(["AX-NFC-100", "AX-NFC-200"]).optional(),
    firmware_version: z.enum(["1.3.0", "1.4.2"]).optional(),
    last_seen_at: Timestamp.optional(),
    status: GateStatus.optional(),
    maintenance_started_at: Timestamp.optional(),
    maintenance_reason: z.string().optional(),
    offline_since: z.enum(["2026-06-30T02:30:00Z"]).optional(),
    offline_reason: z.string().optional(),
  })
  .loose();
export type Gate = z.infer<typeof Gate>;

export const { array: GateList, parse: parseGatesJson } = collectionHelpers(Gate);
