/**
 * benchmarks.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in benchmarks.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { AgeGroupId, BenchmarkId, TestBatteryId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Benchmark = z
  .object({
    id: BenchmarkId,
    tenant_id: z.unknown().nullable(),
    battery_id: TestBatteryId,
    test_key: z.string(),
    sport_key: SportKey,
    age_group_id: AgeGroupId.nullable(),
    age_min: z.number(),
    age_max: z.number(),
    gender: z.enum(["any", "male"]),
    percentile_thresholds: z.record(z.string(), z.unknown()),
    sample_size: z.number(),
    source: z.string(),
    active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Benchmark = z.infer<typeof Benchmark>;

export const { array: BenchmarkList, parse: parseBenchmarksJson } = collectionHelpers(Benchmark);
