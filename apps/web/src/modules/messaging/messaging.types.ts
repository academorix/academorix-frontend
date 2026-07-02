/**
 * @file messaging.types.ts
 * @module modules/messaging/messaging.types
 *
 * @description
 * Module-local types for in-app messaging — conversations and their messages.
 * Thin, module-specific shapes kept local to the messaging module.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.1 "Messaging"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** A conversation thread between staff and members. */
export interface Conversation extends BaseModel, TenantScoped {
  branch_id: string | null;
  /** Thread subject/title. */
  subject: string;
  /** Number of participants in the thread. */
  participant_count: number;
  /** ISO-8601 time of the most recent message (for ordering). */
  last_message_at: string;
}

/** A single message within a {@link Conversation}. */
export interface Message extends BaseModel, TenantScoped {
  conversation_id: string;
  /** Sender's user id. */
  sender_id: string;
  /** Sender's display name (denormalized for the thread view). */
  sender_name: string;
  body: string;
  /** ISO-8601 send time. */
  sent_at: string;
}
