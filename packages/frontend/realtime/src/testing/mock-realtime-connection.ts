/**
 * @file mock-realtime-connection.ts
 * @module @stackra/realtime/testing
 * @description In-memory `IRealtimeConnection` implementation for tests.
 *
 *   Tracks every subscribed channel and every whispered event, and
 *   exposes hooks so tests can simulate inbound server frames without
 *   a real WebSocket.
 */

import type { IRealtimeConnection } from '@/core/interfaces/realtime-connection.interface';
import {
  MockRealtimeChannel,
  MockRealtimePresenceChannel,
  type RecordedWhisper,
} from './mock-realtime-channel';

/**
 * In-memory realtime connection for testing.
 *
 * Channels are cached by name — repeat calls to `channel('foo')` return
 * the same instance. Private and presence channels are distinct
 * namespaces (`private:foo` and `presence:foo`), matching the
 * production convention.
 */
export class MockRealtimeConnection implements IRealtimeConnection {
  /** Shared ledger of every whisper across every channel. */
  public readonly whispers: RecordedWhisper[] = [];

  /** All subscribed channels keyed by fully-qualified name. */
  public readonly channels = new Map<string, MockRealtimeChannel>();

  /** Whether `disconnect()` has been called. */
  private connected = true;

  public channel(name: string): MockRealtimeChannel {
    return this.getOrCreate(name, () => new MockRealtimeChannel(name, this.whispers));
  }

  public privateChannel(name: string): MockRealtimeChannel {
    const key = `private:${name}`;
    return this.getOrCreate(key, () => new MockRealtimeChannel(key, this.whispers));
  }

  public presenceChannel(name: string): MockRealtimePresenceChannel {
    const key = `presence:${name}`;
    return this.getOrCreate(
      key,
      () => new MockRealtimePresenceChannel(key, this.whispers)
    ) as MockRealtimePresenceChannel;
  }

  public disconnect(): void {
    this.connected = false;
    for (const channel of this.channels.values()) channel.leave();
    this.channels.clear();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Test hook — simulate an inbound frame on a specific channel.
   * The channel must have been subscribed first.
   */
  public simulateIncoming(channelName: string, event: string, data: unknown): void {
    this.channels.get(channelName)?.simulateIncoming(event, data);
  }

  /** Drop the whisper ledger without affecting subscriptions. */
  public clearWhispers(): void {
    this.whispers.length = 0;
  }

  private getOrCreate<T extends MockRealtimeChannel>(name: string, factory: () => T): T {
    const cached = this.channels.get(name);
    if (cached) return cached as T;
    const fresh = factory();
    this.channels.set(name, fresh);
    return fresh;
  }
}
