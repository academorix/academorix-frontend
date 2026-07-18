/**
 * checkin-logs.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in checkin-logs.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AttendanceId, CredentialId, GateId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CheckinLog = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    credential_uid: z.enum([
      "0416BB9903A1",
      "0433E811A22F",
      "0489A1245B22",
      "04A21876AA19",
      "04D9F02218CC",
    ]),
    credential_id: CredentialId.nullable(),
    gate_id: GateId,
    direction: z.enum(["in", "out"]),
    at: z.enum([
      "2026-06-15T09:00:00Z",
      "2026-06-27T16:11:00Z",
      "2026-06-28T08:57:00Z",
      "2026-07-06T15:45:00Z",
      "2026-07-06T15:57:00Z",
      "2026-07-06T17:35:00Z",
    ]),
    resolved_member_type: z.enum(["athlete", "staff"]).nullable(),
    resolved_member_id: z.string().nullable(),
    source: z.enum(["android_nfc", "kiosk", "manual"]),
    attendance_id: AttendanceId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
  })
  .loose();
export type CheckinLog = z.infer<typeof CheckinLog>;

export const { array: CheckinLogList, parse: parseCheckinLogsJson } = collectionHelpers(CheckinLog);
