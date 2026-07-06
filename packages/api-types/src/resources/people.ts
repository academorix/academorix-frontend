/**
 * people.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in people.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PersonIdentityId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const People = z
  .object({
    id: PersonIdentityId,
    academorix_id: z.enum([
      "AX-ALX-2035",
      "AX-EMJ-7A21",
      "AX-LMG-8D53",
      "AX-MRF-9C13",
      "AX-NOW-4BX9",
      "AX-OLC-3F42",
    ]),
    first_name: z.enum(["Alex", "Emma", "Liam", "Marco", "Noah", "Olivia"]),
    last_name: z.enum(["Chen", "Ferrari", "Garcia", "Johnson", "Rivera", "Williams"]),
    display_name: z.string(),
    dob: z.enum([
      "1984-02-11",
      "1990-11-23",
      "2010-07-14",
      "2011-11-02",
      "2012-04-18",
      "2013-08-09",
    ]),
    nationality: z.enum(["CA", "IT", "US"]),
    verified: z.boolean(),
    verified_at: Timestamp.nullable(),
    tenant_links: z.array(z.record(z.string(), z.unknown())),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type People = z.infer<typeof People>;

export const { array: PeopleList, parse: parsePeopleJson } = collectionHelpers(People);
