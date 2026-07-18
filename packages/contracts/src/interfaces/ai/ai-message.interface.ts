/**
 * @file ai-message.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description A single message within a conversation thread.
 */

import type { IAiToolCall } from "./ai-tool-call.interface";
import type { IAiSource } from "./ai-source.interface";

/** A conversation message. */
export interface IAiMessage {
  /** Stable message identifier. */
  id: string;
  /** Author role. */
  role: "user" | "assistant" | "system";
  /** Accumulated text (built from `text-delta` events). */
  text: string;
  /** Rendered tool activity for this message. */
  toolCalls: IAiToolCall[];
  /** Citations for assistant messages. */
  sources?: IAiSource[];
  /** Creation timestamp (epoch millis). */
  createdAt: number;
}
