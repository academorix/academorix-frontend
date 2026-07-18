/**
 * staff-transfers.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in staff-transfers.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { StaffTransferKind, StaffTransferStatus } from "../enums.js";
import { StaffId, StaffTransferId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const StaffTransfer = z
  .object({
    id: StaffTransferId,
    tenant_id: TenantId,
    staff_id: StaffId,
    type: StaffTransferKind,
    from_scope: z.record(z.string(), z.unknown()),
    to_scope: z.record(z.string(), z.unknown()),
    reason: z.string(),
    effective_date: DateOnly,
    status: StaffTransferStatus,
    requested_by: z.string(),
    approved_by: z.string().nullable(),
    timeline: z.array(z.record(z.string(), z.unknown())),
    created_at: Timestamp,
    updated_at: Timestamp,
    handover_document_id: z.unknown().nullable().optional(),
  })
  .loose();
export type StaffTransfer = z.infer<typeof StaffTransfer>;

export const { array: StaffTransferList, parse: parseStaffTransfersJson } =
  collectionHelpers(StaffTransfer);
