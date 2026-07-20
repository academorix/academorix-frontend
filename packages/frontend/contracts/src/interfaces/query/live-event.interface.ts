/**
 * @file live-event.interface.ts
 * @module @stackra/contracts/interfaces/query
 * @description The wire shape every `ILiveProvider` produces on
 *   `subscribe` and consumes on `publish`.
 *
 *   Deliberately kept minimal — a channel name, an event type, an
 *   arbitrary JSON payload, and a client-side timestamp. Providers
 *   plugged into the query layer (`@stackra/realtime`,
 *   Ably, Pusher, Supabase, …) all reduce to this shape.
 */

/**
 * Common built-in event types. Providers MAY emit custom string
 * types too — `'*'` matches any type.
 */
export type LiveEventType = "created" | "updated" | "deleted" | "*" | string;

/**
 * A single live event as delivered to subscribers.
 *
 * @remarks The `date` is the client-side arrival time (not the
 *   server publish time) so consumers don't have to reason about
 *   clock skew for local UI ordering. Servers that need authoritative
 *   ordering should include a monotonic id inside `payload`.
 */
export interface ILiveEvent {
  /**
   * Channel the event landed on. Consumers match this against their
   * own `subscribe({ channel })` argument.
   */
  readonly channel: string;

  /**
   * Event type discriminator. `'created' | 'updated' | 'deleted'`
   * cover the common CRUD triple; custom strings widen the union.
   */
  readonly type: LiveEventType;

  /**
   * Free-form event payload. Common convention: put affected record
   * ids under `payload.ids: BaseKey[]` so subscribers can decide
   * whether to invalidate.
   */
  readonly payload: Record<string, unknown>;

  /** Client-side arrival timestamp. */
  readonly date: Date;

  /**
   * Optional provider metadata (routing hints, tenant id, driver
   * name). Consumers may ignore.
   */
  readonly meta?: Record<string, unknown>;
}
