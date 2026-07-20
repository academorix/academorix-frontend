/**
 * @file coordinator-message-kind.enum.ts
 * @module @stackra/coordinator/core/enums
 * @description Enum for internal coordinator message types
 *   exchanged via BroadcastChannel between tabs.
 */

/**
 * Types of messages exchanged between tabs during coordination.
 */
export enum CoordinatorMessageKind {
  /** Leader sends periodic heartbeats to prove liveness. */
  HEARTBEAT = "heartbeat",
  /** A tab attempts to claim leadership. */
  CLAIM = "claim",
  /** The current leader voluntarily resigns. */
  RESIGNED = "resigned",
  /** A tab announces its presence (new tab joined). */
  ANNOUNCE = "announce",
}
