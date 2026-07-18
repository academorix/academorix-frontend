/**
 * @file coordinator-transport.service.ts
 * @module @stackra/coordinator/core/services
 * @description Cross-tab event relay transport for `@stackra/events`.
 *   Implements `IEventTransport` — relays events matching configured
 *   patterns to all other browser tabs via the shared
 *   `ITabTransportManager`.
 *
 *   Register with `@EventTransport({ name: 'cross-tab' })` for
 *   auto-discovery, or register manually via
 *   `EventTransportRegistry`.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import {
  COORDINATOR_CONFIG,
  TAB_TRANSPORT_MANAGER,
  type IEventEmitterSync,
  type ITabTransport,
  type ITabTransportManager,
} from '@stackra/contracts';
import { Str } from '@stackra/support';
import type { ICoordinatorModuleOptions } from '@/core/interfaces';
import type { IRelayMessage } from '@/core/interfaces/relay-message.interface';

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Channel name shared by every tab for event relay. */
const RELAY_CHANNEL = 'stackra-event-relay';

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Cross-tab event relay transport.
 *
 * When connected to the EventEmitter, subscribes to all events
 * matching the configured patterns and relays them to other tabs
 * through the shared `ITabTransportManager`. Inbound relayed events
 * are re-emitted on the local EventEmitter.
 *
 * @example
 * ```typescript
 * // Events matching 'auth.**' or 'sync.**' are relayed to all tabs.
 * // Tab A emits 'auth.logout' → Tab B/C/D receive it locally.
 * ```
 */
@Injectable()
export class CoordinatorTransport {
  /** Channel handle resolved from the transport manager. */
  private transport: ITabTransport | null = null;

  /** Unsubscribe handle from the transport's subscribe call. */
  private unsubscribe: (() => void) | null = null;

  /** The connected emitter instance. */
  private emitter: IEventEmitterSync | null = null;

  /** Unique tab ID to prevent echo (don't re-emit own events). */
  private readonly tabId: string;

  /** Patterns to match for relay. */
  private readonly patterns: string[];

  /** Delimiter for pattern matching. */
  private readonly delimiter = '.';

  /** Whether broadcasting is enabled. */
  private readonly enabled: boolean;

  /**
   * @param manager - Optional transport manager. When absent (SSR /
   *   non-DOM) the transport is inert.
   * @param config - Module configuration.
   */
  public constructor(
    @Optional() @Inject(TAB_TRANSPORT_MANAGER) private readonly manager?: ITabTransportManager,
    @Optional() @Inject(COORDINATOR_CONFIG) config?: ICoordinatorModuleOptions
  ) {
    this.tabId = Str.uuid();
    this.patterns = config?.broadcastPatterns ?? ['sync:**', 'auth:**', 'state:**'];
    this.enabled = config?.broadcastEvents ?? true;
  }

  /**
   * Connect the transport to an EventEmitter.
   *
   * Called by EventSubscribersLoader at bootstrap (if decorated with
   * `@EventTransport`) or manually.
   *
   * @param emitter - The application's EventEmitter
   */
  public connect(emitter: IEventEmitterSync): void {
    if (!this.enabled) return;
    if (!this.manager || !this.manager.isSupported()) return;

    this.emitter = emitter;
    this.transport = this.manager.channel(RELAY_CHANNEL);

    // Listen for incoming relayed events from other tabs
    this.unsubscribe = this.transport.subscribe((data) => {
      const msg = data as IRelayMessage;
      if (!msg || msg.kind !== 'event-relay') return;
      if (msg.sourceTabId === this.tabId) return; // Don't echo own events
      // Re-emit on the local emitter
      this.emitter?.emit(msg.event, ...msg.args);
    });
  }

  /**
   * Disconnect the transport and release resources.
   */
  public disconnect(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    // The transport manager owns channel lifecycle — don't close
    // the shared channel from here; other subscribers may still
    // rely on it.
    this.transport = null;
    this.emitter = null;
  }

  /**
   * Relay an event to other tabs (called when a matching event is
   * emitted locally).
   *
   * @param event - Event name
   * @param args - Event arguments
   */
  public relay(event: string, ...args: unknown[]): void {
    if (!this.transport) return;
    if (!this.matchesPatterns(event)) return;

    const msg: IRelayMessage = {
      kind: 'event-relay',
      event,
      args,
      sourceTabId: this.tabId,
    };

    this.transport.broadcast(msg);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Pattern Matching
  // ══════════════════════════════════════════════════════════════════════════════

  /** Check if an event matches any of the configured patterns. */
  private matchesPatterns(event: string): boolean {
    return this.patterns.some((pattern) => this.matchWildcard(pattern, event));
  }

  /** Wildcard pattern match (* = one segment, ** = one or more). */
  private matchWildcard(pattern: string, event: string): boolean {
    const pp = pattern.split(this.delimiter);
    const ep = event.split(this.delimiter);
    return this.matchParts(pp, 0, ep, 0);
  }

  private matchParts(pattern: string[], pi: number, event: string[], ei: number): boolean {
    if (pi === pattern.length && ei === event.length) return true;
    if (pi === pattern.length) return false;
    const seg = pattern[pi];
    if (seg === '**') {
      for (let skip = 1; skip <= event.length - ei; skip++) {
        if (this.matchParts(pattern, pi + 1, event, ei + skip)) return true;
      }
      return false;
    }
    if (ei === event.length) return false;
    if (seg === '*') return this.matchParts(pattern, pi + 1, event, ei + 1);
    if (seg === event[ei]) return this.matchParts(pattern, pi + 1, event, ei + 1);
    return false;
  }
}
