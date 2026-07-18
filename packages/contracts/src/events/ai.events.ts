/**
 * @file ai.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/ai` on the `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (dashboards,
 *   telemetry, coordinators) can subscribe without depending on the AI
 *   runtime.
 */

/**
 * AI lifecycle event names.
 */
export const AI_EVENTS = {
  /** A chat stream started. */
  STREAM_STARTED: "ai.stream.started",
  /** A chat stream ended. */
  STREAM_ENDED: "ai.stream.ended",
  /** A tool call was issued. */
  TOOL_CALLED: "ai.tool.called",
  /** A tool produced a result. */
  TOOL_RESULT: "ai.tool.result",
  /** The registered client-tool set changed. */
  TOOLSET_CHANGED: "ai.toolset.changed",
  /** The registered context-frame set changed (register/update/unregister). */
  CONTEXT_CHANGED: "ai.context.changed",
  /** A UI context snapshot was synced to the backend. */
  CONTEXT_SYNCED: "ai.context.synced",
  /** The transport connection state changed. */
  CONNECTION_CHANGED: "ai.connection.changed",
  /** A draft-then-confirm write became pending. */
  DRAFT_PENDING: "ai.draft.pending",
  /** A pending draft was confirmed. */
  DRAFT_CONFIRMED: "ai.draft.confirmed",
} as const;

/** Union type of every emitted AI event name. */
export type AiEventName = (typeof AI_EVENTS)[keyof typeof AI_EVENTS];
