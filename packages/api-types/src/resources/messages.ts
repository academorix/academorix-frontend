/**
 * messages.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in messages.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { MessageId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Message = z
  .object({
    id: MessageId,
    tenant_id: TenantId,
    conversation_id: z.string(),
    sender_user_id: z.string(),
    sender_name: z.string(),
    body: z.string(),
    attachments: z.array(z.record(z.string(), z.unknown()).loose()),
    read_receipts: z.array(z.record(z.string(), z.unknown()).loose()),
    sent_at: Timestamp,
    edited_at: z.unknown().nullable(),
    deleted_at: z.unknown().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Message = z.infer<typeof Message>;

export const { array: MessageList, parse: parseMessagesJson } = collectionHelpers(Message);
