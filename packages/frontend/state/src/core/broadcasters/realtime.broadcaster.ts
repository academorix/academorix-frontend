/**
 * @file realtime.broadcaster.ts
 * @module @stackra/state/core/broadcasters
 * @description Syncs stores from WebSocket/realtime events.
 *
 *   Listens to `realtime:state.*` events (emitted by `@stackra/realtime`)
 *   and applies updates to the corresponding store, honoring the configured
 *   update strategy.
 *
 *   Enabled per-store via `realtime: true` in `StateModule.forFeature()`.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import type { OnModuleInit } from "@stackra/container";
import { EVENT_EMITTER, STATE_EVENTS } from "@stackra/contracts";
import type { IEventEmitter, UpdateStrategy } from "@stackra/contracts";
import { Logger } from "@stackra/logger";
import type { Store } from "@tanstack/store";
import { StateRegistry } from "../registries/state.registry";

/** Pending realtime update awaiting application. */
interface PendingRealtimeUpdate {
  /** The store name. */
  storeName: string;
  /** The new state from the server. */
  state: unknown;
  /** Timestamp of the server event. */
  timestamp: number;
}

/**
 * Applies realtime (WebSocket) updates to reactive stores.
 *
 * ## Flow
 * ```
 * Server push (WebSocket)
 *   → @stackra/realtime emits "realtime:state.{storeName}.updated"
 *   → RealtimeBroadcaster applies it (based on updateStrategy)
 *   → emits "{storeName}.realtime.received"
 * ```
 */
@Injectable()
export class RealtimeBroadcaster implements OnModuleInit {
  private readonly logger = new Logger("StateRealtimeBroadcaster");

  /** Store names that have realtime sync enabled. */
  private readonly enabledStores = new Map<string, UpdateStrategy>();

  /** Pending updates for stores with non-instant strategies. */
  private readonly pendingUpdates: PendingRealtimeUpdate[] = [];

  public constructor(
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
    @Optional() @Inject(StateRegistry) private readonly registry?: StateRegistry,
  ) {}

  /**
   * Register a store for realtime sync.
   *
   * @param name - The store name.
   * @param strategy - How to apply incoming updates.
   */
  public enableForStore(name: string, strategy: UpdateStrategy = "instant"): void {
    this.enabledStores.set(name, strategy);
    this.logger.debug(`Realtime enabled for store: ${name} (strategy: ${strategy})`);
  }

  /**
   * Get pending updates for a store (for "prompt" or "manual" strategies).
   *
   * @param storeName - The store name (omit for all pending updates).
   * @returns Array of pending updates.
   */
  public getPendingUpdates(storeName?: string): PendingRealtimeUpdate[] {
    if (storeName) {
      return this.pendingUpdates.filter((u) => u.storeName === storeName);
    }
    return [...this.pendingUpdates];
  }

  /**
   * Apply all pending updates for a store.
   *
   * @param storeName - The store name.
   */
  public applyPending(storeName: string): void {
    const updates = this.pendingUpdates.filter((u) => u.storeName === storeName);
    if (updates.length === 0) return;

    const latest = updates[updates.length - 1]!;
    this.applyToStore(latest.storeName, latest.state);

    const remaining = this.pendingUpdates.filter((u) => u.storeName !== storeName);
    this.pendingUpdates.length = 0;
    this.pendingUpdates.push(...remaining);
  }

  /**
   * Subscribe to realtime events on module initialization.
   */
  public onModuleInit(): void {
    if (!this.events) {
      this.logger.debug("No EventEmitter — realtime state sync disabled");
      return;
    }

    // Wildcard listeners receive the event name as the first argument (see
    // the EventEmitter contract) — cast bridges the narrower listener type.
    this.events.on("realtime:state.*", this.handleEvent.bind(this) as (payload: unknown) => void);
    this.logger.debug("Realtime state broadcaster active");
  }

  /**
   * Handle a realtime event.
   */
  private handleEvent(eventName: string, payload: unknown): void {
    const storeName = this.parseStoreName(eventName);
    if (!storeName) return;
    if (!this.enabledStores.has(storeName)) return;

    const strategy = this.enabledStores.get(storeName) ?? "instant";
    const data = payload as { state?: unknown; data?: unknown } | undefined;
    const state = data?.state ?? data?.data ?? payload;

    this.logger.debug(`Realtime: ${eventName} → ${storeName} (strategy: ${strategy})`);

    switch (strategy) {
      case "instant":
        this.applyToStore(storeName, state);
        break;

      case "prompt":
      case "manual":
        this.pendingUpdates.push({ storeName, state, timestamp: Date.now() });
        this.events?.emit(`${storeName}.realtime.pending`, {
          state,
          pendingCount: this.getPendingUpdates(storeName).length,
        });
        break;

      case "next-open":
        try {
          sessionStorage.setItem(`__state_realtime_pending_${storeName}`, JSON.stringify(state));
        } catch {
          this.applyToStore(storeName, state);
        }
        break;
    }
  }

  /**
   * Apply state to the store and emit an event.
   */
  private applyToStore(storeName: string, state: unknown): void {
    if (!this.registry) return;

    const entry = this.registry.get(storeName);
    if (!entry) return;

    (entry.store as Store<unknown>).setState(() => state);
    this.events?.emit(`${storeName}.${STATE_EVENTS.REALTIME_RECEIVED}`, {
      state,
      timestamp: Date.now(),
    });
  }

  /**
   * Parse "realtime:state.{storeName}.{action}" into the store name.
   */
  private parseStoreName(eventName: string): string | null {
    const stripped = eventName.replace("realtime:state.", "");
    const parts = stripped.split(".");
    return parts[0] ?? null;
  }
}
