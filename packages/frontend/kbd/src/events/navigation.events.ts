/**
 * @file navigation.events.ts
 * @module @stackra/kbd/events
 * @description Event-name constants emitted by the kbd subsystem when a
 *   shortcut / palette command wants to navigate.
 *
 *   The kbd package intentionally does NOT depend on `@stackra/routing`;
 *   it fires an event on the shared `EVENT_EMITTER` and lets whichever
 *   router is mounted decide how to react. This preserves headless use
 *   (a CLI, a native shell, a test harness) where "navigation" may be
 *   a no-op or a bespoke handler.
 *
 *   The event constant is a plain object frozen `as const` so consumers
 *   get literal string types on both the emit + `@OnEvent(...)` side.
 */

/**
 * Canonical navigation command names emitted by kbd shortcuts and
 * palette commands. Kept local to the kbd package until they either
 * promote to `@stackra/contracts` (cross-package contract) or move
 * into `@stackra/routing`'s own event catalogue.
 */
export const NavigationCommands = {
  /**
   * The keyboard subsystem wants to navigate to a client-side route.
   *
   * ## Payload
   * `{ path: string }` — the URL / path to navigate to.
   *
   * ## Emitters
   * - `KbdProvider` (wires this into `listener.setNavigate` /
   *   `palette.setNavigate`).
   *
   * ## Current listeners
   * - The application's router bridge (e.g. a `@stackra/routing`
   *   listener in the host app) reacts by calling its `useNavigate`.
   *
   * ## Order
   * Undefined — listeners react independently.
   */
  NAVIGATE: "kbd.navigation.navigate",
} as const;

/** Union of every navigation command name owned by kbd. */
export type NavigationCommandName = (typeof NavigationCommands)[keyof typeof NavigationCommands];
