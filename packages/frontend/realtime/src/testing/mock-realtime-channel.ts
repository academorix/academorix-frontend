/**
 * @file mock-realtime-channel.ts
 * @module @stackra/realtime/testing
 * @description In-memory `IRealtimeChannel` implementation for tests.
 *
 *   Records every whispered event and dispatches to registered listeners
 *   when `simulateIncoming()` is called from a test. Presence variant
 *   layers on `here` / `joining` / `leaving` handlers.
 */

import type {
  IRealtimeChannel,
  IRealtimePresenceChannel,
} from '@/core/interfaces/realtime-connection.interface';

/** Recorded whisper entry — channel, event, and payload. */
export interface RecordedWhisper<T = unknown> {
  channel: string;
  event: string;
  data: T;
  whisperedAt: number;
}

type Handler = (data: unknown) => void;

/**
 * In-memory realtime channel for testing.
 *
 * `whisper()` calls are appended to the shared `whispers` array on the
 * parent connection. Listeners registered via `on()` can be triggered
 * from tests using `simulateIncoming()`.
 */
export class MockRealtimeChannel implements IRealtimeChannel {
  /** Registered listeners keyed by event name. */
  protected readonly handlers = new Map<string, Set<Handler>>();

  /** Whether the channel has been left. */
  private left = false;

  public constructor(
    /** Channel name — echoed in whisper records. */
    public readonly name: string,
    /** Shared whisper ledger owned by the parent connection. */
    private readonly whispers: RecordedWhisper[]
  ) {}

  public on(event: string, handler: Handler): this {
    let bucket = this.handlers.get(event);
    if (!bucket) {
      bucket = new Set();
      this.handlers.set(event, bucket);
    }
    bucket.add(handler);
    return this;
  }

  public off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  public leave(): void {
    this.left = true;
    this.handlers.clear();
  }

  public whisper(event: string, data: unknown): this {
    this.whispers.push({ channel: this.name, event, data, whisperedAt: Date.now() });
    return this;
  }

  /** True after `leave()` has been called. */
  public isLeft(): boolean {
    return this.left;
  }

  /**
   * Test hook — simulate an incoming server event on this channel.
   * Invokes every listener registered for `event` with `data`.
   */
  public simulateIncoming(event: string, data: unknown): void {
    if (this.left) return;
    const bucket = this.handlers.get(event);
    if (!bucket) return;
    for (const handler of bucket) handler(data);
  }
}

/**
 * In-memory presence channel — extends the base with `here`, `joining`,
 * and `leaving` hooks.
 */
export class MockRealtimePresenceChannel
  extends MockRealtimeChannel
  implements IRealtimePresenceChannel
{
  private hereCallbacks: Array<(members: unknown[]) => void> = [];
  private joiningCallbacks: Array<(member: unknown) => void> = [];
  private leavingCallbacks: Array<(member: unknown) => void> = [];

  /** Current member roster — set from tests via `simulatePresence()`. */
  public members: unknown[] = [];

  public here(callback: (members: unknown[]) => void): this {
    this.hereCallbacks.push(callback);
    callback(this.members);
    return this;
  }

  public joining(callback: (member: unknown) => void): this {
    this.joiningCallbacks.push(callback);
    return this;
  }

  public leaving(callback: (member: unknown) => void): this {
    this.leavingCallbacks.push(callback);
    return this;
  }

  /** Test hook — simulate a member joining. */
  public simulateJoining(member: unknown): void {
    this.members.push(member);
    for (const cb of this.joiningCallbacks) cb(member);
  }

  /** Test hook — simulate a member leaving. */
  public simulateLeaving(member: unknown): void {
    this.members = this.members.filter((m) => m !== member);
    for (const cb of this.leavingCallbacks) cb(member);
  }

  /** Test hook — set the initial roster (fires every registered `here` callback). */
  public simulatePresence(members: unknown[]): void {
    this.members = [...members];
    for (const cb of this.hereCallbacks) cb(this.members);
  }
}
