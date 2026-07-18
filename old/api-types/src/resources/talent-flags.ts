/**
 * talent-flags.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in talent-flags.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { Priority, TalentFlagStatus } from "../enums.js";
import { AthleteId, PathwayStageId, TalentFlagId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TalentFlag = z
  .object({
    id: TalentFlagId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    flag_type: z.enum([
      "elite_candidate",
      "leadership",
      "promotion_result",
      "technical",
      "trial_invite",
    ]),
    priority: Priority,
    notes: z.string(),
    flagged_by: z.string(),
    flagged_at: Timestamp,
    review_at: Timestamp.optional(),
    status: TalentFlagStatus,
    restricted: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
    reason_summary: z.string().optional(),
    promoted_from_stage_id: PathwayStageId.optional(),
    promoted_to_stage_id: PathwayStageId.optional(),
    promoted_at: Timestamp.optional(),
    unflagged_at: Timestamp.optional(),
    unflagged_by: z.string().optional(),
    unflag_reason: z.string().optional(),
    graduated_out_at: Timestamp.optional(),
    graduation_reason: z.string().optional(),
  })
  .loose();
export type TalentFlag = z.infer<typeof TalentFlag>;

export const { array: TalentFlagList, parse: parseTalentFlagsJson } = collectionHelpers(TalentFlag);
