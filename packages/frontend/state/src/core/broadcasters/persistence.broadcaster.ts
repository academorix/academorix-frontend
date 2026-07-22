/**
 * @file persistence.broadcaster.ts
 * @module @stackra/state/core/broadcasters
 * @description Persists and hydrates store state through
 *   `@stackra/storage`.
 *
 *   Listens to `{name}.changed` events and writes the new state to a
 *   named `IStorage` instance resolved from the injected
 *   `StorageManager`. On initialization it hydrates every registered
 *   store from the same instance, and it re-hydrates on the browser's
 *   `storage` event for cross-tab reactivity when the underlying
 *   driver is a browser `Storage`.
 *
 *   Enabled per-store via `persistence: '<instance>' | false` in
 *   `StateModule.forFeature()`. The `<instance>` value is looked up as
 *   an `IStorage` instance name on the `StorageManager` — the app
 *   configures it in `WebStorageModule.forRoot({ stores })` /
 *   `NativeStorageModule.forRoot({ stores })`.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import type { OnModuleInit } from "@stackra/container";
import {
  EVENT_EMITTER,
  STATE_EVENTS,
  STORAGE_MANAGER,
  type IEventEmitter,
  type IStorage,
  type IStorageManager,
  type PersistenceTarget,
} from "@stackra/contracts";
import { Logger } from "@stackra/logger";
import { Str } from "@stackra/support";
import type { Store } from "@tanstack/store";
import { StateRegistry } from "../registries/state.registry";

/** Storage key prefix for persisted state. */
const STORAGE_PREFIX = "__stackra_state_";

/**
 * Persists store state through `@stackra/storage` and hydrates on load.
 */
@Injectable()
export class PersistenceBroadcaster implements OnModuleInit {
  private readonly logger = new Logger("PersistenceBroadcaster");

  /** Store names mapped to their `IStorage` instance name. */
  private readonly enabledStores = new Map<string, string>();

  /** Debounce timers per store to avoid excessive writes. */
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /** Debounce delay in milliseconds. */
  private readonly debounceMs = 100;

  public constructor(
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
    @Optional() @Inject(StateRegistry) private readonly registry?: StateRegistry,
    @Optional() @Inject(STORAGE_MANAGER) private readonly storage?: IStorageManager,
  ) {}

  /**
   * Register a store for persistence.
   *
   * @param name - The store name.
   * @param target - The `IStorage` instance name (or `false` to opt out).
   */
  public enableForStore(name: string, target: PersistenceTarget): void {
    if (target === false) return;
    this.enabledStores.set(name, target);
    this.logger.debug(`Persistence enabled for store: ${name} → ${target}`);
  }

  /**
   * Hydrate stores from persisted state and wire change listeners.
   */
  public onModuleInit(): void {
    if (!this.events) {
      this.logger.debug("No EventEmitter — persistence disabled");
      return;
    }

    if (this.enabledStores.size > 0 && !this.storage) {
      // The broadcaster stays alive so the change listener still fires
      // (harmless when persistence is disabled), but every write / read
      // is a no-op — surface the reason once at startup so consumers
      // aren't confused about missing state on reload.
      this.logger.warn(
        "[PersistenceBroadcaster] Persistence requested but STORAGE_MANAGER " +
          "is not provided. Import WebStorageModule / NativeStorageModule " +
          "upstream to enable persistence.",
      );
    }

    // Hydration is async — fire-and-forget the promise; the store just
    // renders its initial state until hydration lands.
    for (const [name, target] of this.enabledStores) {
      void this.hydrate(name, target);
    }

    // Wildcard listeners receive the event name as the first argument
    // (see the EventEmitter contract) — cast bridges the narrower
    // listener type.
    this.events.on(
      `*.${STATE_EVENTS.CHANGED}`,
      this.handleChange.bind(this) as (payload: unknown) => void,
    );

    if (typeof window !== "undefined") {
      window.addEventListener("storage", this.handleStorageEvent.bind(this));
    }

    this.logger.debug("Persistence broadcaster active");
  }

  /**
   * Handle a store change — persist to storage (debounced).
   */
  private handleChange(eventName: string, payload: unknown): void {
    const storeName = eventName.replace(`.${STATE_EVENTS.CHANGED}`, "");
    if (!this.enabledStores.has(storeName)) return;

    const existing = this.debounceTimers.get(storeName);
    if (existing) clearTimeout(existing);

    const state = (payload as { state?: unknown } | undefined)?.state;
    this.debounceTimers.set(
      storeName,
      setTimeout(() => {
        void this.persist(storeName, state);
        this.debounceTimers.delete(storeName);
      }, this.debounceMs),
    );
  }

  /**
   * Persist state through the configured `IStorage`.
   */
  private async persist(name: string, state: unknown): Promise<void> {
    const target = this.enabledStores.get(name);
    if (!target) return;

    const instance = this.getInstance(target);
    if (!instance) return;

    try {
      await instance.set(`${STORAGE_PREFIX}${name}`, state);
      this.logger.debug(`Persisted: ${name}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to persist store: ${name}`, { error: String(error) });
    }
  }

  /**
   * Hydrate a store from persisted state.
   */
  private async hydrate(name: string, target: string): Promise<void> {
    if (!this.registry) return;

    const instance = this.getInstance(target);
    if (!instance) return;

    try {
      const state = await instance.get<unknown>(`${STORAGE_PREFIX}${name}`);
      if (state === null) return;

      const entry = this.registry.get(name);
      if (!entry) return;

      (entry.store as Store<unknown>).setState(() => state);
      this.events?.emit(`${name}.${STATE_EVENTS.HYDRATED}`, { state });
      this.logger.debug(`Hydrated: ${name}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to hydrate store: ${name}`, { error: String(error) });
    }
  }

  /**
   * Resolve the named `IStorage` instance, or `null` when the manager
   * isn't available or the instance isn't declared.
   */
  private getInstance(name: string): IStorage | null {
    if (!this.storage) return null;
    try {
      return this.storage.instance(name);
    } catch (error: unknown) {
      // Instance not declared — surface the reason but stay soft so
      // one misconfigured store doesn't break the app.
      this.logger.warn(`[PersistenceBroadcaster] IStorage instance "${name}" not resolved`, {
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Handle the browser's `storage` event for cross-tab reactivity.
   *
   * Fires when another tab modifies localStorage. Iterates every
   * registered store, matching `event.key` by an `endsWith` check on
   * `__stackra_state_${name}` so we survive any `IStorage` prefix the
   * underlying driver adds. Re-hydrates the affected store, or resets
   * it to initial state if the key was removed.
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key) return;

    // Find the affected store — the one whose namespaced key suffix
    // matches this event.
    let matchedName: string | undefined;
    for (const name of this.enabledStores.keys()) {
      const suffix = `${STORAGE_PREFIX}${name}`;
      if (event.key === suffix || Str.endsWith(event.key, `:${suffix}`)) {
        matchedName = name;
        break;
      }
    }
    if (!matchedName || !this.registry) return;

    const entry = this.registry.get(matchedName);
    if (!entry) return;

    const store = entry.store as Store<unknown>;

    if (event.newValue === null) {
      store.setState(() => entry.initialState ?? {});
      this.logger.debug(`Storage cleared externally, reset store: ${matchedName}`);
      this.events?.emit(`${matchedName}.${STATE_EVENTS.HYDRATED}`, {
        state: entry.initialState ?? {},
      });
      return;
    }

    // Cross-tab payload is a JSON-string (the write went through
    // localStorage). Try to unwrap a TTL envelope if the storage
    // driver wrote one, otherwise treat the parsed value as-is.
    try {
      const parsed = JSON.parse(event.newValue) as unknown;
      const state =
        typeof parsed === "object" && parsed !== null && "v" in parsed
          ? (parsed as { v: unknown }).v
          : parsed;
      store.setState(() => state);
      this.logger.debug(`Storage updated externally, re-hydrated: ${matchedName}`);
      this.events?.emit(`${matchedName}.${STATE_EVENTS.HYDRATED}`, { state });
    } catch {
      this.logger.warn(`Failed to parse storage event for: ${matchedName}`);
    }
  }
}
