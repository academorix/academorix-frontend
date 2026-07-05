/**
 * ai-tool-calls.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in ai-tool-calls.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { AiRunId, AiToolCallId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AiToolCall = z
  .object({
    id: AiToolCallId,
    tenant_id: TenantId,
    run_id: AiRunId,
    tool: z.string(),
    args_hash: z.enum([
      "a1c2f3e4",
      "a9b0c1d2",
      "b3c4d5e6",
      "b8d9e0f1",
      "c4e5b6a7",
      "c7d8e9f0",
      "d1f2a3b4",
      "d4e5f6a7",
      "e0a1b2c3",
      "e5b6c7d8",
      "f1a2b3c4",
      "f2a3b4c5",
    ]),
    result_summary: z.string(),
    duration_ms: z.number(),
    error: z.string().nullable(),
    authorized_by_scope: z.string(),
  })
  .loose();
export type AiToolCall = z.infer<typeof AiToolCall>;

export const { array: AiToolCallList, parse: parseAiToolCallsJson } = collectionHelpers(AiToolCall);
