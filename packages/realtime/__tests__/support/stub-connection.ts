/**
 * @file stub-connection.ts
 * @module @stackra/realtime/__tests__/support
 * @description Test-only `IRealtimeConnection` — records disconnect
 *   and channel calls without opening a real socket.
 */

import type {
  IRealtimeChannel,
  IRealtimeConnection,
  IRealtimePresenceChannel,
} from '@stackra/contracts';

/** A subscribed channel that records `.on`/`.whisper`/`.leave` calls. */
class StubChannel implements IRealtimeChannel {
  public readonly listeners: Record<string, Function[]> = {};
  public readonly whispers: Array<{ event: string; data: unknown }> = [];
  public isLeft = false;

  public constructor(public readonly name: string) {}

  public on(event: string, handler: (data: unknown) => void): this {
    (this.listeners[event] ??= []).push(handler);
    return this;
  }

  public off(event: string, handler: (data: unknown) => void): this {
    const bucket = this.listeners[event];
    if (bucket) this.listeners[event] = bucket.filter((h) => h !== handler);
    return this;
  }

  public leave(): void {
    this.isLeft = true;
  }

  public whisper(event: string, data: unknown): this {
    this.whispers.push({ event, data });
    return this;
  }
}

/** Presence variant — extends stub with roster + membership hooks. */
class StubPresenceChannel extends StubChannel implements IRealtimePresenceChannel {
  public readonly hereCallbacks: Array<(members: unknown[]) => void> = [];
  public readonly joiningCallbacks: Array<(member: unknown) => void> = [];
  public readonly leavingCallbacks: Array<(member: unknown) => void> = [];

  public here(callback: (members: unknown[]) => void): this {
    this.hereCallbacks.push(callback);
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
}

/** Test-only connection — records disconnect calls, caches channels. */
export class StubConnection implements IRealtimeConnection {
  public disconnected = false;

  public readonly channels = new Map<string, StubChannel>();

  public channel(name: string): IRealtimeChannel {
    return this.getOrCreate(name, () => new StubChannel(name));
  }

  public privateChannel(name: string): IRealtimeChannel {
    return this.getOrCreate(`private:${name}`, (key) => new StubChannel(key));
  }

  public presenceChannel(name: string): IRealtimePresenceChannel {
    return this.getOrCreate(
      `presence:${name}`,
      (key) => new StubPresenceChannel(key)
    ) as IRealtimePresenceChannel;
  }

  public disconnect(): void {
    this.disconnected = true;
    for (const channel of this.channels.values()) channel.leave();
  }

  public isConnected(): boolean {
    return !this.disconnected;
  }

  private getOrCreate<T extends StubChannel>(name: string, factory: (key: string) => T): T {
    const cached = this.channels.get(name);
    if (cached) return cached as T;
    const fresh = factory(name);
    this.channels.set(name, fresh);
    return fresh;
  }
}
