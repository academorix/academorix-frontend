/**
 * @file coordinator-message.type.ts
 * @module @stackra/coordinator/core/types
 * @description Internal message shape exchanged between tabs via BroadcastChannel.
 */

import { CoordinatorMessageKind } from "@/core/enums";

/**
 * Union of all coordinator message types exchanged between tabs.
 */
export type CoordinatorMessage =
  | { kind: CoordinatorMessageKind.HEARTBEAT; tabId: string; at: number }
  | { kind: CoordinatorMessageKind.CLAIM; tabId: string; at: number }
  | { kind: CoordinatorMessageKind.RESIGNED; tabId: string }
  | { kind: CoordinatorMessageKind.ANNOUNCE; tabId: string; at: number };
