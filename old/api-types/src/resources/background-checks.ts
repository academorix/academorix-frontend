/**
 * background-checks.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in background-checks.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BackgroundCheckStatus, BackgroundCheckType } from "../enums.js";
import { DocumentId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const BackgroundCheck = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    staff_id: StaffId,
    type: BackgroundCheckType,
    status: BackgroundCheckStatus,
    reference: z
      .enum(["DBS-2021-40114", "DBS-2024-88771", "PC-IT-2025-99401", "REF-SW-2025"])
      .nullable(),
    issued_at: Timestamp.nullable(),
    verified_at: Timestamp.nullable(),
    expires_at: Timestamp.nullable(),
    verified_by: z.string().nullable(),
    document_id: DocumentId.nullable(),
    restricted: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
  })
  .loose();
export type BackgroundCheck = z.infer<typeof BackgroundCheck>;

export const { array: BackgroundCheckList, parse: parseBackgroundChecksJson } =
  collectionHelpers(BackgroundCheck);
