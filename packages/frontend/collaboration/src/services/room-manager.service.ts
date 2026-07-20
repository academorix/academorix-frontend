/**
 * RoomManager service — manages collaboration room lifecycle.
 *
 * Handles transport selection, room connections, and provides the
 * transport instance to hooks for communication.
 *
 * @module @stackra/collaboration/services
 * @category Services
 */

import { Injectable } from '@stackra/container';
import { Logger } from '@stackra/logger';

import type { CollaborationTransport } from '@/interfaces/transport.interface';
import { BroadcastChannelTransport } from '@/transports/broadcast-channel.transport';
import { ReverbTransport } from '@/transports/reverb.transport';

/** Transport strategy configuration. */
type TransportStrategy = 'reverb' | 'broadcast' | 'auto';

/**
 * Manages collaboration room lifecycle and transport selection.
 *
 * The RoomManager is the central service that hooks use to access the
 * active transport. It handles transport creation based on the configured
 * strategy and provides a stable reference for the lifetime of the app.
 *
 * @example
 * ```typescript
 * const manager = new RoomManager();
 * manager.configure({ transport: 'broadcast' });
 * const transport = manager.getTransport();
 * await transport.connect('room-1', 'user-abc', { name: 'Alice' });
 * ```
 */
@Injectable()
export class RoomManager {
  private readonly logger = new Logger(RoomManager.name);

  /** The active transport instance. */
  private transport: CollaborationTransport | null = null;

  /** The configured transport strategy. */
  private strategy: TransportStrategy = 'auto';

  /** Reference to the RealtimeManager (if available via DI). */
  private realtimeManager: unknown = null;

  /**
   * Configure the room manager with a transport strategy.
   *
   * @param options - Configuration options.
   * @param options.transport - The transport strategy to use.
   * @param options.realtimeManager - Optional RealtimeManager instance for Reverb.
   *
   * @example
   * ```typescript
   * manager.configure({ transport: 'broadcast' });
   * ```
   */
  public configure(options: { transport?: TransportStrategy; realtimeManager?: unknown }): void {
    this.strategy = options.transport ?? 'auto';
    this.realtimeManager = options.realtimeManager ?? null;
    this.transport = null; // Reset so next getTransport() creates fresh
    this.logger.info(`Configured with strategy: ${this.strategy}`);
  }

  /**
   * Get the active collaboration transport.
   *
   * Creates the transport on first access based on the configured strategy.
   * Subsequent calls return the same instance.
   *
   * @returns The active CollaborationTransport instance.
   *
   * @example
   * ```typescript
   * const transport = manager.getTransport();
   * await transport.connect('room-1', 'user-abc', {});
   * ```
   */
  public getTransport(): CollaborationTransport {
    if (this.transport) {
      return this.transport;
    }

    switch (this.strategy) {
      case 'broadcast': {
        this.logger.info('Using BroadcastChannel transport');
        this.transport = new BroadcastChannelTransport();
        break;
      }

      case 'reverb': {
        this.logger.info('Using Reverb transport');
        this.transport = new ReverbTransport(this.realtimeManager);
        break;
      }

      case 'auto':
      default: {
        if (this.realtimeManager) {
          this.logger.info('Auto-selected Reverb transport (RealtimeManager available)');
          this.transport = new ReverbTransport(this.realtimeManager);
        } else {
          this.logger.info('Auto-selected BroadcastChannel transport (no RealtimeManager)');
          this.transport = new BroadcastChannelTransport();
        }
        break;
      }
    }

    return this.transport;
  }
}
