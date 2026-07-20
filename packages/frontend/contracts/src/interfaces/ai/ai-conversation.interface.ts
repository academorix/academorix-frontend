/**
 * @file ai-conversation.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description An ordered conversation thread.
 */

import type { AiRunStatus } from "@/enums/ai-run-status.enum";
import type { IAiMessage } from "./ai-message.interface";

/** A conversation thread and its ordered messages. */
export interface IAiConversation {
  /** Thread identifier. */
  threadId: string;
  /** Persona/agent slug scoping this conversation. */
  personaSlug: string;
  /** Ordered messages. */
  messages: IAiMessage[];
  /** Active run id, for cancellation/resume. */
  runId?: string;
  /** Current run status. */
  status: AiRunStatus;
}
