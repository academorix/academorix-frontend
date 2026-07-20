/**
 * @file actions.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by the action dispatcher on the shared
 *   event bus. Consumers subscribe to track dispatched actions, tracing,
 *   or authorization outcomes.
 */

/**
 * Action dispatcher lifecycle event names.
 */
export const ACTION_EVENTS = {
  /** Emitted before an action handler runs. Payload: `{ descriptor, startedAt }`. */
  STARTED: "action.started",
  /** Emitted after a handler returns `{ success: true }`. Payload: `{ descriptor, response, elapsedMs }`. */
  SUCCEEDED: "action.succeeded",
  /** Emitted after a handler returns `{ success: false }` or throws. Payload: `{ descriptor, response, elapsedMs }`. */
  FAILED: "action.failed",
  /** Emitted when the authorize middleware approves a descriptor. Payload: `{ descriptor }`. */
  AUTHORIZED: "action.authorized",
  /** Emitted when the authorize middleware denies a descriptor. Payload: `{ descriptor }`. */
  DENIED: "action.denied",
  /** Emitted after a handler is registered with the dispatcher. Payload: `{ kind }`. */
  HANDLER_REGISTERED: "action.handler-registered",
} as const;

/** Union type of every emitted action event name. */
export type ActionEventName = (typeof ACTION_EVENTS)[keyof typeof ACTION_EVENTS];
