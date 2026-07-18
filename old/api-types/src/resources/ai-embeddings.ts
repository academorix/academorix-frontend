/**
 * ai-embeddings.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in ai-embeddings.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AiEmbeddingId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AiEmbedding = z
  .object({
    id: AiEmbeddingId,
    tenant_id: TenantId,
    source_type: z.enum(["announcement", "coach_note", "document", "drill", "scouting_report"]),
    source_id: z.string(),
    model: z.string(),
    dimensions: z.number(),
    chunk_count: z.number(),
    indexed_at: Timestamp,
  })
  .loose();
export type AiEmbedding = z.infer<typeof AiEmbedding>;

export const { array: AiEmbeddingList, parse: parseAiEmbeddingsJson } =
  collectionHelpers(AiEmbedding);
