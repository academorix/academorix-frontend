/**
 * @file realtime-client.type.ts
 * @module @academorix/realtime/client/realtime-client.type
 *
 * @description
 * Structural interface every {@link createRealtimeClient} instance
 * satisfies. Kept as its own file (separate from the factory) so
 * hooks + adapters can type against it without touching the runtime.
 */

/** Loose channel interface — Laravel Echo's Channel plus what we call on it. */
export interface RealtimeChannel {
  /** Subscribe to a specific event by name. Returns `this` for chaining. */
  listen(event: string, callback: (payload: unknown) => void): RealtimeChannel;
  /** Subscribe to every event on the channel. */
  listenToAll(callback: (eventName: string, payload: unknown) => void): RealtimeChannel;
  /** Unsubscribe from a specific event. */
  stopListening(event: string): RealtimeChannel;
  /** Optional; only on presence channels. */
  here?(callback: (members: unknown[]) => void): RealtimeChannel;
  joining?(callback: (member: unknown) => void): RealtimeChannel;
  leaving?(callback: (member: unknown) => void): RealtimeChannel;
}

/**
 * The public surface of a realtime client. Apps hold one instance and
 * pass it to hooks / providers.
 *
 * `channel` / `private` / `presence` are the three subscription types
 * Laravel supports (matching Echo's method names). `disconnect` tears
 * the transport down (used on logout).
 */
export interface RealtimeClient {
  /**
   * Subscribe to a **public** channel — anyone can listen without
   * authentication. Suitable for tenant-wide broadcasts that don't
   * carry PII.
   */
  channel(name: string): RealtimeChannel;

  /**
   * Subscribe to a **private** channel — the `/broadcasting/auth`
   * endpoint must authorise the current session. Suitable for
   * per-user notifications.
   */
  private(name: string): RealtimeChannel;

  /**
   * Subscribe to a **presence** channel — like private, but the
   * server tracks who's connected. Exposes `here` / `joining` /
   * `leaving` callbacks in addition to `listen`.
   */
  presence(name: string): RealtimeChannel;

  /**
   * Leave a channel (all subscribers). Called by the hook cleanup
   * when the last consumer unmounts.
   */
  leave(name: string): void;

  /**
   * Tear down the transport entirely — used on logout so a
   * subsequent login re-authorises with fresh credentials.
   */
  disconnect(): Promise<void>;
}
