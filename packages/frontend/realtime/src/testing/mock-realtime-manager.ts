/**
 * @file mock-realtime-manager.ts
 * @module @stackra/realtime/testing
 * @description In-memory realtime manager surface for tests.
 *
 *   Mirrors `RealtimeManager` — resolves named connections lazily and
 *   supports `registerConnection()` for tests that want to inject a
 *   pre-configured mock.
 */

import { MockRealtimeConnection } from "./mock-realtime-connection";

/**
 * Assertable-friendly mock realtime manager.
 *
 * Every call to `.connection(name)` returns the same
 * `MockRealtimeConnection` for a given name, cached forever until
 * `.disconnect(name)` is invoked. Tests use this handle to assert on
 * whispers, subscribed channels, and to simulate inbound server frames.
 */
export class MockRealtimeManager {
  /** Cached connections keyed by name. */
  private readonly connections = new Map<string, MockRealtimeConnection>();

  /** Test-configurable default connection name. */
  private defaultConnection: string = "default";

  public getDefaultDriver(): string {
    return this.defaultConnection;
  }

  /** Test helper — override the default connection name. */
  public setDefaultDriver(name: string): void {
    this.defaultConnection = name;
  }

  public async connection(name?: string): Promise<MockRealtimeConnection> {
    const key = name ?? this.defaultConnection;
    const cached = this.connections.get(key);
    if (cached) return cached;
    const fresh = new MockRealtimeConnection();
    this.connections.set(key, fresh);
    return fresh;
  }

  public registerConnection(name: string, connection: MockRealtimeConnection): void {
    this.connections.set(name, connection);
  }

  public async disconnect(name?: string): Promise<void> {
    const key = name ?? this.defaultConnection;
    const conn = this.connections.get(key);
    if (conn) {
      conn.disconnect();
      this.connections.delete(key);
    }
  }

  public async disconnectAll(): Promise<void> {
    for (const key of Array.from(this.connections.keys())) {
      await this.disconnect(key);
    }
  }

  public getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  // ── Driver-facing hooks (parity with real RealtimeManager) ───────────

  /** No-op that records the call — assert via `.$.wasCalledWith('reportReconnecting', ...)`. */
  public reportReconnecting(_connection: string, _attempt: number): void {
    /* recorded by assertable proxy */
  }

  public reportError(_connection: string, _error: unknown): void {
    /* recorded by assertable proxy */
  }

  public reportMessage(
    _connection: string,
    _channel: string,
    _event: string,
    _data: unknown,
  ): void {
    /* recorded by assertable proxy */
  }
}
