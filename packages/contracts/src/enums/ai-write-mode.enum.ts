/**
 * @file ai-write-mode.enum.ts
 * @module @stackra/contracts/enums
 * @description Write mode governing how an AI action mutates backend state.
 */

/** How an AI action is permitted to mutate state. */
export enum AiWriteMode {
  /** Read-only; no mutation. */
  Read = "read",
  /** Produces a draft that must be confirmed before applying. */
  Draft = "draft",
  /** Writes directly. */
  Write = "write",
}
