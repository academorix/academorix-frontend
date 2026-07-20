/**
 * @file cross-tab.broadcaster.ts
 * @module @stackra/state/core/broadcasters
 * @description Syncs store mutations across browser tabs via the
 *   shared `ITabTransportManager` from `@stackra/coordinator`.
 *
 *   Listens to `{name}.changed` events from local stores and
 *   broadcasts the new state to other tabs on the
 *   `__stackra_state_sync` channel. Inbound messages are applied
 *   to the matching local store (without re-emitting, to avoid
 *   feedback loops).
 *
 *   Enabled per-store via `crossTab: true` in
 *   `StateModule.forFeature()`.
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import type { OnModuleInit, OnModuleDestroy } from '@stackra/container';
import {
  EVENT_EMITTER,
  STATE_EVENTS,
  TAB_TRANSPORT_MANAGER,
  type IEventEmitter,
  type ITabTransport,
  type ITabTransportManager,
} from '@stackra/contracts';
import { Logger } from '@stackra/logger';
import type { Store } from '@tanstack/store';
import { StateRegistry } from '../registries/state.registry';

/** Channel name shared across tabs for state sync. */
const CHANNEL_NAME = '__stackra_state_sync';

/** Message shape broadcast between tabs. */
interface CrossTabMessage {
  /** The store name (e.g. "theme", "i18n"). */
  storeName: string;
  /** The new state to apply. */
  state: unknown;
  /** Timestamp of the change. */
  timestamp: number;
}

/**
 * Syncs store state across browser tabs.
 *
 * ## Outbound
 * ```
 * Local setState() → auto-emits "{name}.changed"
 *   → CrossTabBroadcaster posts the new state through the
 *     ITabTransport channel
 * ```
 *
 * ## Inbound
 * ```
 * Other tab posts a state change
 *   → CrossTabBroadcaster applies it to the local store (no re-broadcast)
 * ```
 */
@Injectable()
export class CrossTabBroadcaster implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('CrossTabBroadcaster');

  /** Store names that have cross-tab sync enabled. */
  private readonly enabledStores = new Set<string>();

  /** Channel handle resolved from the transport manager. */
  private transport: ITabTransport | null = null;

  /** Handle from the transport's subscribe call. */
  private unsubscribe: (() => void) | null = null;

  /** Guard to prevent re-broadcasting inbound changes. */
  private isSyncing = false;

  public constructor(
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
    @Optional() @Inject(StateRegistry) private readonly registry?: StateRegistry,
    @Optional() @Inject(TAB_TRANSPORT_MANAGER) private readonly manager?: ITabTransportManager
  ) {}

  /**
   * Register a store for cross-tab sync.
   *
   * @param name - The store name.
   */
  public enableForStore(name: string): void {
    this.enabledStores.add(name);
    this.logger.debug(`Cross-tab enabled for store: ${name}`);
  }

  /**
   * Wire outbound broadcasting and inbound listening.
   */
  public onModuleInit(): void {
    if (!this.events) {
      this.logger.debug('No EventEmitter — cross-tab sync disabled');
      return;
    }

    if (!this.manager || !this.manager.isSupported()) {
      this.logger.debug('No cross-tab transport — sync disabled');
      return;
    }

    this.transport = this.manager.channel(CHANNEL_NAME);
    this.unsubscribe = this.transport.subscribe((data) => {
      this.handleInbound(data as CrossTabMessage);
    });

    // Outbound: listen to all store changes and broadcast to other tabs.
    // Wildcard listeners receive the event name as the first argument (see
    // the EventEmitter contract) — cast bridges the narrower listener type.
    this.events.on(
      `*.${STATE_EVENTS.CHANGED}`,
      this.handleOutbound.bind(this) as (payload: unknown) => void
    );
    this.logger.debug('Cross-tab state broadcaster active');
  }

  /**
   * Release the transport subscription on teardown. The shared
   * channel itself stays alive — the transport manager owns its
   * lifecycle.
   */
  public onModuleDestroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.transport = null;
  }

  /**
   * Handle a local store change — broadcast to other tabs.
   */
  private handleOutbound(eventName: string, payload: unknown): void {
    if (this.isSyncing) return;
    if (!this.transport) return;

    const storeName = eventName.replace(`.${STATE_EVENTS.CHANGED}`, '');
    if (!this.enabledStores.has(storeName)) return;

    const message: CrossTabMessage = {
      storeName,
      state: (payload as { state?: unknown } | undefined)?.state,
      timestamp: Date.now(),
    };

    this.transport.broadcast(message);
    this.logger.debug(`Broadcast: ${storeName}`);
  }

  /**
   * Handle an inbound state change from another tab.
   */
  private handleInbound(message: CrossTabMessage): void {
    if (!this.registry) return;
    if (!message?.storeName) return;
    if (!this.enabledStores.has(message.storeName)) return;

    const entry = this.registry.get(message.storeName);
    if (!entry) return;

    this.isSyncing = true;
    try {
      const store = entry.store as Store<unknown>;
      store.setState(() => message.state);

      this.events?.emit(`${message.storeName}.${STATE_EVENTS.SYNC_RECEIVED}`, {
        state: message.state,
        timestamp: message.timestamp ?? Date.now(),
      });

      this.logger.debug(`Inbound sync applied: ${message.storeName}`);
    } finally {
      this.isSyncing = false;
    }
  }
}
