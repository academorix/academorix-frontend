/**
 * ai-conversations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in ai-conversations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AiConversationStatus, AiPersona } from "../enums.js";
import { AiConversationId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AiConversation = z
  .object({
    id: AiConversationId,
    tenant_id: TenantId,
    user_id: UserId,
    persona: AiPersona,
    title: z.string(),
    status: AiConversationStatus,
    model_preference: z.string(),
    tokens_in_total: z.number(),
    tokens_out_total: z.number(),
    cost_minor: z.number(),
    currency: z.enum(["USD"]),
    messages_count: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
    last_message_at: Timestamp,
  })
  .loose();
export type AiConversation = z.infer<typeof AiConversation>;

export const { array: AiConversationList, parse: parseAiConversationsJson } =
  collectionHelpers(AiConversation);
