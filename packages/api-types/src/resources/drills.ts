/**
 * drills.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in drills.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { DrillId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Drill = z
  .object({
    id: DrillId,
    tenant_id: TenantId,
    sport_key: SportKey,
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    level: z.enum(["advanced", "beginner", "intermediate"]),
    duration_minutes: z.number(),
    media_document_id: z.unknown().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    age_bands: z.array(z.string()).optional(),
    category_key: z
      .enum(["conditioning", "defending", "passing", "physical", "stroke", "tactical", "technique"])
      .optional(),
    equipment: z.array(z.string()).optional(),
    coaching_points: z.array(z.string()).optional(),
    difficulty: z.enum(["advanced", "beginner", "intermediate"]).optional(),
    diagram_url: z.unknown().nullable().optional(),
    video_url: z.unknown().nullable().optional(),
    is_public: z.boolean().optional(),
    created_by_staff_id: StaffId.optional(),
  })
  .loose();
export type Drill = z.infer<typeof Drill>;

export const { array: DrillList, parse: parseDrillsJson } = collectionHelpers(Drill);
