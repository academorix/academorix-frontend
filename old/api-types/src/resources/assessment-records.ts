/**
 * assessment-records.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in assessment-records.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CardType, SportKey } from "../enums.js";
import { AssessmentRecordId, AthleteEnrollmentId, AthleteId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AssessmentRecord = z
  .object({
    id: AssessmentRecordId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    enrollment_id: AthleteEnrollmentId,
    sport_key: SportKey,
    card_type: CardType,
    set_version: z.number(),
    attribute_set_version: z.number(),
    values: z.record(z.string(), z.unknown()),
    overall: z.number(),
    rank: z.enum(["bronze", "diamond", "gold", "silver"]),
    coach_id: StaffId,
    recorded_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type AssessmentRecord = z.infer<typeof AssessmentRecord>;

export const { array: AssessmentRecordList, parse: parseAssessmentRecordsJson } =
  collectionHelpers(AssessmentRecord);
