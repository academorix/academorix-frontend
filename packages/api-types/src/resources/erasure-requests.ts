/**
 * erasure-requests.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in erasure-requests.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ErasureRequestStatus } from "../enums.js";
import { AthleteId, DocumentId, ErasureRequestId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ErasureRequest = z
  .object({
    id: ErasureRequestId,
    tenant_id: TenantId,
    subject_type: z.enum(["athlete"]),
    subject_id: AthleteId,
    requested_by_user_id: UserId,
    status: ErasureRequestStatus,
    rejection_reason: z.string().nullable(),
    export_document_id: DocumentId.nullable(),
    approved_by_user_id: UserId.nullable(),
    executed_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type ErasureRequest = z.infer<typeof ErasureRequest>;

export const { array: ErasureRequestList, parse: parseErasureRequestsJson } =
  collectionHelpers(ErasureRequest);
