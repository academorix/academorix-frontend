/**
 * sports.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in sports.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Sport = z
  .object({
    id: SportId,
    key: z.enum(["basketball", "football", "karate", "swimming"]),
    name: z.enum(["Basketball", "Football", "Karate", "Swimming"]),
    category: z.enum(["aquatic", "combat", "team"]),
    is_team_sport: z.boolean(),
    scoring_type: z.enum(["belt", "goals", "points", "time"]),
    default_team_size: z.number(),
    capabilities: z.array(z.string()),
    terminology: z.record(z.string(), z.unknown()),
    status: z.enum(["active"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Sport = z.infer<typeof Sport>;

export const { array: SportList, parse: parseSportsJson } = collectionHelpers(Sport);
