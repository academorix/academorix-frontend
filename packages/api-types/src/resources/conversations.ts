/**
 * conversations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in conversations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ConversationType } from "../enums.js";
import { BranchId, OrganizationId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Conversation = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId.nullable(),
    type: ConversationType,
    scope: z.enum(["athlete", "branch", "team"]),
    subject: z.string(),
    created_by_user_id: z.string(),
    participants: z.array(z.record(z.string(), z.unknown()).loose()),
    participant_count: z.number(),
    last_message_at: Timestamp,
    last_message_preview: z.string(),
    unread_count: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Conversation = z.infer<typeof Conversation>;

export const { array: ConversationList, parse: parseConversationsJson } =
  collectionHelpers(Conversation);
