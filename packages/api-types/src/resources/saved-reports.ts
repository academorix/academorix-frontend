/**
 * saved-reports.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in saved-reports.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { DocumentId, ReportDefinitionId, SavedReportId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SavedReport = z
  .object({
    id: SavedReportId,
    tenant_id: TenantId,
    definition_id: ReportDefinitionId,
    owner_user_id: UserId,
    name: z.string(),
    parameters: z.record(z.string(), z.unknown()),
    schedule: z.record(z.string(), z.unknown()).nullable(),
    last_run_at: Timestamp,
    last_run_document_id: DocumentId.nullable(),
    visibility: z.enum(["private", "shared"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type SavedReport = z.infer<typeof SavedReport>;

export const { array: SavedReportList, parse: parseSavedReportsJson } =
  collectionHelpers(SavedReport);
