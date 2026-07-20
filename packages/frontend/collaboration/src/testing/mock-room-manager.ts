/**
 * @file mock-room-manager.ts
 * @module @stackra/collaboration/testing
 * @description In-memory mock of `RoomManager`.
 *
 *   Always returns a `MockCollaborationTransport` regardless of the
 *   configured strategy. Tests can grab the transport via `.getTransport()`
 *   and drive it with the `simulate*` hooks.
 */

import type { CollaborationTransport } from '@/interfaces/transport.interface';
import { MockCollaborationTransport } from './mock-collaboration-transport';

/** Transport strategy accepted by `configure()` — mirrors the real service. */
type TransportStrategy = 'reverb' | 'broadcast' | 'auto';

/**
 * Mock room manager for tests.
 *
 * Always hands out a `MockCollaborationTransport`. Strategy passed to
 * `configure()` is recorded but does not change the transport type.
 */
export class MockRoomManager {
  /** Underlying mock transport — shared across every `.getTransport()` call. */
  public readonly transport: MockCollaborationTransport = new MockCollaborationTransport();

  /** Last strategy passed to `configure()` — inspectable by tests. */
  public strategy: TransportStrategy = 'auto';

  /** Last `realtimeManager` passed to `configure()` — inspectable by tests. */
  public realtimeManager: unknown = null;

  public configure(options: { transport?: TransportStrategy; realtimeManager?: unknown }): void {
    this.strategy = options.transport ?? 'auto';
    this.realtimeManager = options.realtimeManager ?? null;
  }

  public getTransport(): CollaborationTransport {
    return this.transport;
  }

  /** Drop the transport ledger — useful between tests. */
  public reset(): void {
    this.transport.reset();
    this.strategy = 'auto';
    this.realtimeManager = null;
  }
}
