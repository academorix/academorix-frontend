/**
 * @file sdui.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by the SDUI runtime on the shared
 *   event bus.
 */

/**
 * SDUI runtime lifecycle events.
 */
export const SDUI_EVENTS = {
  /** A screen was resolved (cache-miss fetch). */
  SCREEN_RESOLVED: "sdui.screen.resolved",
  /** A cached screen was invalidated. */
  SCREEN_INVALIDATED: "sdui.screen.invalidated",
  /** An action was dispatched from a rendered node. */
  ACTION_DISPATCHED: "sdui.action.dispatched",
  /** A node completed a render pass. */
  NODE_RENDERED: "sdui.node.rendered",
  /** A node caught an error via its error boundary. */
  NODE_ERRORED: "sdui.node.errored",
  /** A screen's data source finished loading. */
  DATA_SOURCE_LOADED: "sdui.datasource.loaded",
  /** A screen's data source failed to load. */
  DATA_SOURCE_FAILED: "sdui.datasource.failed",
  /** A server-driven theme scope mounted. */
  THEME_APPLIED: "sdui.theme.applied",
} as const;

/** Union type of every emitted SDUI event name. */
export type SduiEventName = (typeof SDUI_EVENTS)[keyof typeof SDUI_EVENTS];
