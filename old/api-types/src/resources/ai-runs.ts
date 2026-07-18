/**
 * ai-runs.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in ai-runs.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AiRunStatus } from "../enums.js";
import { AiConversationId, AiRunId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AiRun = z
  .object({
    id: AiRunId,
    tenant_id: TenantId,
    conversation_id: AiConversationId,
    model: z.string(),
    prompt_id: z.string(),
    tokens_in: z.number(),
    tokens_out: z.number(),
    cost_minor: z.number(),
    latency_ms: z.number(),
    status: AiRunStatus,
    error: z.string().nullable(),
    started_at: Timestamp,
    completed_at: Timestamp,
  })
  .loose();
export type AiRun = z.infer<typeof AiRun>;

export const { array: AiRunList, parse: parseAiRunsJson } = collectionHelpers(AiRun);
