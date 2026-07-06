/**
 * test-batteries.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in test-batteries.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { SportId, TenantId, TestBatteryId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TestBatterie = z
  .object({
    id: TestBatteryId,
    tenant_id: TenantId,
    sport_id: SportId.nullable(),
    sport_key: SportKey.nullable(),
    name: z.string(),
    version: z.number(),
    tests: z.array(z.record(z.string(), z.unknown())),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type TestBatterie = z.infer<typeof TestBatterie>;

export const { array: TestBatterieList, parse: parseTestBatteriesJson } =
  collectionHelpers(TestBatterie);
