/**
 * @file mock-permission-status.ts
 * @module @stackra/notifications/testing
 * @description Fake `PermissionStatus` used by `navigator.permissions.query`
 *   in the notification permission hook tests.
 *
 *   Consumers construct one, then call `simulateStateChange(next)`
 *   to trigger the `change` event the hook listens for.
 */

type Listener = () => void;

/**
 * Fake permission status.
 *
 * `state` mirrors the real API surface. Registered listeners are
 * invoked by {@link MockPermissionStatus.simulateStateChange}.
 */
export class MockPermissionStatus {
  private readonly listeners = new Set<Listener>();

  public constructor(public state: "granted" | "denied" | "prompt" = "prompt") {}

  /** Add a listener — mirrors the real API. */
  public addEventListener(type: "change", listener: Listener): void {
    if (type !== "change") return;
    this.listeners.add(listener);
  }

  /** Remove a listener. */
  public removeEventListener(type: "change", listener: Listener): void {
    if (type !== "change") return;
    this.listeners.delete(listener);
  }

  /** Change the state and fire the `change` listeners. */
  public simulateStateChange(next: "granted" | "denied" | "prompt"): void {
    this.state = next;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken listener must not break the others.
      }
    }
  }
}
