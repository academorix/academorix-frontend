/**
 * business-types.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in business-types.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
// `BusinessType` in ../enums.ts is the closed-enum for `key`; alias it so we
// can keep the resource schema class-name matching the file (BusinessType).
import { BusinessType as BusinessTypeKey } from "../enums.js";
import { BusinessTypeId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const BusinessType = z
  .object({
    id: BusinessTypeId,
    key: BusinessTypeKey,
    label: z.string(),
    description: z.string(),
    default_config: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type BusinessType = z.infer<typeof BusinessType>;

export const { array: BusinessTypeList, parse: parseBusinessTypesJson } =
  collectionHelpers(BusinessType);
