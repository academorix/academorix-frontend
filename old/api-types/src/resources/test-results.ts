/**
 * test-results.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in test-results.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { AthleteEnrollmentId, AthleteId, StaffId, TenantId, TestBatteryId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TestResult = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    athlete_id: AthleteId,
    enrollment_id: AthleteEnrollmentId,
    sport_key: SportKey,
    battery_id: TestBatteryId,
    battery: z.string(),
    assessor_id: StaffId,
    tested_at: Timestamp,
    attribute_set_version: z.number(),
    attributes: z.record(z.string(), z.unknown()),
    percentile_by_age: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type TestResult = z.infer<typeof TestResult>;

export const { array: TestResultList, parse: parseTestResultsJson } = collectionHelpers(TestResult);
