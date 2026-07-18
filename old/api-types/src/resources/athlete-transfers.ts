/**
 * athlete-transfers.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in athlete-transfers.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { AthleteTransferKind, AthleteTransferStatus } from "../enums.js";
import { ApprovalTaskId, AthleteId, AthleteTransferId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AthleteTransfer = z
  .object({
    id: AthleteTransferId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    type: AthleteTransferKind,
    from_scope: z.record(z.string(), z.unknown()),
    to_scope: z.record(z.string(), z.unknown()),
    reason: z.string(),
    effective_date: DateOnly,
    status: AthleteTransferStatus,
    requested_by: z.string(),
    approved_by: z.string().nullable(),
    approval_task_id: ApprovalTaskId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type AthleteTransfer = z.infer<typeof AthleteTransfer>;

export const { array: AthleteTransferList, parse: parseAthleteTransfersJson } =
  collectionHelpers(AthleteTransfer);
