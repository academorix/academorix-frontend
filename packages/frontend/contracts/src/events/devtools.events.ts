/**
 * @file devtools.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/devtools` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (analytics
 *   fan-out, monitoring, tests) can subscribe without depending on the
 *   devtools runtime.
 */

/**
 * Devtools event names.
 */
export const DEVTOOLS_EVENTS = {
  /** A panel was registered against the panels registry. */
  PANEL_REGISTERED: "devtools.panel.registered",
  /** A panel was unregistered. */
  PANEL_UNREGISTERED: "devtools.panel.unregistered",
  /** The user activated a panel (opened it in the shell). */
  PANEL_ACTIVATED: "devtools.panel.activated",
  /** The shell was opened (drawer / bottom sheet made visible). */
  SHELL_OPENED: "devtools.shell.opened",
  /** The shell was closed. */
  SHELL_CLOSED: "devtools.shell.closed",
  /** The inspector overlay was enabled. */
  INSPECTOR_ENABLED: "devtools.inspector.enabled",
  /** The inspector overlay was disabled. */
  INSPECTOR_DISABLED: "devtools.inspector.disabled",
  /** A region in the inspector overlay was clicked. */
  INSPECTOR_REGION_CLICKED: "devtools.inspector.region_clicked",
  /** A `type: 'action'` panel action fired. */
  ACTION_TRIGGERED: "devtools.action.triggered",
} as const;

/** Union of every emitted devtools event name. */
export type DevtoolsEventName = (typeof DEVTOOLS_EVENTS)[keyof typeof DEVTOOLS_EVENTS];
