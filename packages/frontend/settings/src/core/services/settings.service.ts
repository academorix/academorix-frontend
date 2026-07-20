/**
 * @file settings.service.ts
 * @module @stackra/settings/core/services
 * @description High-level `ISettingsService` — the API consumers use
 *   to read, write, subscribe to, and hydrate settings groups.
 *
 *   Key design decisions:
 *   - **Sync `get()`** — backed by an in-memory `Map` cache so React
 *     `useState(() => service.get(dto))` initializers work. Async
 *     stores (`api`) hydrate the cache in the background and notify
 *     subscribers on completion.
 *   - **Debounced persist** — writes are coalesced per group and
 *     flushed after `config.debounceMs` (default 300ms). The manager
 *     store's `save` handles the actual persistence.
 *   - **Subscription bus** — a per-group `Set<callback>` fires on any
 *     mutation (local `set*`, `reset*`, `hydrate*`, or an inbound
 *     broadcast merged via `hydrateValues`).
 *   - **Fail-soft events** — every mutation emits a corresponding
 *     `SETTINGS_EVENTS.*` on the optional event bus for cross-package
 *     observability (analytics, audit, sdui).
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import {
  EVENT_EMITTER,
  SETTINGS_CONFIG,
  SETTINGS_EVENTS,
  SETTINGS_MANAGER,
  SETTINGS_REGISTRY,
  type IEventEmitter,
  type ISettingDefinition,
  type ISettingsConfig,
  type ISettingsManager,
  type ISettingsRegistry,
  type ISettingsService,
  type ISettingsStore,
  type SettingsSubscriber,
  type SettingsUnsubscribe,
  type Type,
} from "@stackra/contracts";

import { SettingsNotRegisteredError, SettingsUpdateFailedError } from "@/core/errors";
import { resolveFieldDefaults } from "@/core/utils/resolve-field-defaults.util";

/**
 * Build a deferred promise — a promise plus resolvers we can call
 * out-of-band. `Promise.withResolvers` isn't available across every
 * runtime we ship into yet, so we handcraft it.
 */
function createDeferred(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
} {
  let resolveFn: () => void = () => undefined;
  let rejectFn: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolveFn = res;
    rejectFn = rej;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
}

/**
 * `ISettingsService` implementation.
 */
@Injectable()
export class SettingsService implements ISettingsService {
  /** In-memory cache keyed by group key. */
  private readonly cache = new Map<string, Record<string, unknown>>();

  /** Per-group subscription lists. */
  private readonly listeners = new Map<string, Set<SettingsSubscriber>>();

  /** Per-group debounced-persist timers. */
  private readonly persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Per-group deferred that resolves when the currently-scheduled
   * persist finishes (or rejects when it errors). Callers holding
   * onto `awaitPersist(key)` join whichever cycle is currently
   * pending — a subsequent `set*` call replaces the deferred with
   * a new one so awaiters get the LATEST-cycle outcome.
   */
  private readonly persistDeferred = new Map<
    string,
    { promise: Promise<void>; resolve: () => void; reject: (error: unknown) => void }
  >();

  /**
   * Per-group in-flight hydration promise. Prevents multiple parallel
   * `load()` calls when the same group is requested repeatedly before
   * the first response arrives.
   */
  private readonly hydrationInFlight = new Map<string, Promise<void>>();

  public constructor(
    @Inject(SETTINGS_CONFIG) private readonly config: ISettingsConfig,
    @Inject(SETTINGS_REGISTRY) private readonly registry: ISettingsRegistry,
    @Inject(SETTINGS_MANAGER) private readonly manager: ISettingsManager,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // READ — DTO + key flavours
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public get<T>(dto: Type<T>): T {
    return this.getValues(this.resolveByDto(dto)) as T;
  }

  /** @inheritDoc */
  public getByKey(groupKey: string): Record<string, unknown> | undefined {
    const definition = this.registry.get(groupKey);
    return definition ? this.getValues(definition) : undefined;
  }

  /** @inheritDoc */
  public getGroups(): readonly ISettingDefinition[] {
    return this.registry.all();
  }

  /** @inheritDoc */
  public getGroup(key: string): ISettingDefinition | undefined {
    return this.registry.get(key);
  }

  // ══════════════════════════════════════════════════════════════════
  // WRITE
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public set<T>(dto: Type<T>, key: keyof T & string, value: unknown): void {
    this.setByKey(this.resolveByDto(dto).key, key, value);
  }

  /** @inheritDoc */
  public setMany<T>(dto: Type<T>, partial: Partial<T>): void {
    this.setManyByKey(this.resolveByDto(dto).key, partial as Record<string, unknown>);
  }

  /** @inheritDoc */
  public setByKey(groupKey: string, fieldKey: string, value: unknown): void {
    this.setManyByKey(groupKey, { [fieldKey]: value });
  }

  /** @inheritDoc */
  public setManyByKey(groupKey: string, values: Record<string, unknown>): void {
    const definition = this.registry.get(groupKey);
    if (!definition) throw new SettingsNotRegisteredError(groupKey);

    const current = this.getValues(definition);
    // Freeze the merged snapshot so useSyncExternalStore identity
    // checks stay reliable — see `getValues` for the reasoning.
    const merged = Object.freeze({ ...current, ...values });
    this.cache.set(groupKey, merged);

    this.schedulePersist(groupKey, merged, Object.keys(values));
    this.notifyListeners(groupKey);
    this.emitChanged(groupKey, Object.keys(values), values, "local");
  }

  /** @inheritDoc */
  public reset<T>(dto: Type<T>): void {
    this.resetByKey(this.resolveByDto(dto).key);
  }

  /** @inheritDoc */
  public resetByKey(groupKey: string): void {
    const definition = this.registry.get(groupKey);
    if (!definition) throw new SettingsNotRegisteredError(groupKey);

    const defaults = Object.freeze(resolveFieldDefaults(definition));
    this.cache.set(groupKey, defaults);

    // Clear on the store synchronously (or fire-and-forget for async).
    const store = this.manager.storeForGroup(groupKey);
    const clearResult = store.clear(groupKey);
    if (clearResult instanceof Promise) {
      clearResult.catch(() => {
        // fail-soft — the local cache is already at defaults.
      });
    }

    this.notifyListeners(groupKey);
    this.emitEvent(SETTINGS_EVENTS.GROUP_RESET, { group: groupKey });
  }

  // ══════════════════════════════════════════════════════════════════
  // HYDRATION
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public hydrateValues(groupKey: string, values: Record<string, unknown>): void {
    const definition = this.registry.get(groupKey);
    if (!definition) return;

    const merged = Object.freeze({ ...resolveFieldDefaults(definition), ...values });
    this.cache.set(groupKey, merged);
    this.notifyListeners(groupKey);
    this.emitChanged(groupKey, Object.keys(values), values, "remote");
  }

  /** @inheritDoc */
  public hydrateAll(data: Record<string, Record<string, unknown>>): void {
    for (const [key, values] of Object.entries(data)) {
      this.hydrateValues(key, values);
    }
  }

  /**
   * @inheritDoc
   *
   * Two-tier strategy:
   *
   * 1. **Store `loadAll()` primitive.** When the default store
   *    implements the optional method (the `api` driver hits
   *    `GET /settings` in one request), delegate to it. Fastest
   *    path — one round trip regardless of group count.
   * 2. **Per-group fallback.** Otherwise iterate every registered
   *    group and call `store.load(key)` in parallel. Same net
   *    behaviour, more requests.
   *
   * Fail-soft — the loader logs and moves on. Callers that need
   * confirmation should call `getGroups()` + inspect the cache
   * after the promise resolves.
   */
  public awaitPersist(groupKey: string): Promise<void> {
    const pending = this.persistDeferred.get(groupKey);
    // No persist in flight or scheduled — resolve immediately.
    return pending ? pending.promise : Promise.resolve();
  }

  /**
   * @inheritDoc
   */
  public async loadAll(): Promise<void> {
    // Prefer the default store's bulk primitive when available.
    // Per-group overrides in `config.groups` still take effect for
    // reads (the store manager routes those through `storeForGroup`)
    // — the bulk path just primes the default store's cache in one
    // hop for the common case where every group shares the same
    // store.
    const defaultStore = this.manager.instance();
    if (typeof defaultStore.loadAll === "function") {
      const groups = await defaultStore.loadAll();
      this.hydrateAll(groups);
      return;
    }

    // Fallback: per-group loads in parallel.
    const definitions = this.registry.all();
    const results = await Promise.all(
      definitions.map(async (def) => {
        try {
          const store = this.manager.storeForGroup(def.key);
          const values = await store.load(def.key);
          return [def.key, values] as const;
        } catch {
          // fail-soft — one bad group must not fail the whole batch.
          return null;
        }
      }),
    );

    for (const entry of results) {
      if (!entry) continue;
      this.hydrateValues(entry[0], entry[1]);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // EXPORT / IMPORT
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public exportAll(): Record<string, Record<string, unknown>> {
    const snapshot: Record<string, Record<string, unknown>> = {};
    for (const definition of this.registry.all()) {
      snapshot[definition.key] = this.getValues(definition);
    }
    return snapshot;
  }

  /** @inheritDoc */
  public importAll(data: Record<string, Record<string, unknown>>): void {
    for (const [key, values] of Object.entries(data)) {
      if (this.registry.has(key)) {
        this.setManyByKey(key, values);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // SUBSCRIBE
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public subscribe(groupKey: string, callback: SettingsSubscriber): SettingsUnsubscribe {
    let bucket = this.listeners.get(groupKey);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(groupKey, bucket);
    }
    bucket.add(callback);

    return () => {
      const current = this.listeners.get(groupKey);
      if (current) {
        current.delete(callback);
        if (current.size === 0) this.listeners.delete(groupKey);
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — resolution
  // ══════════════════════════════════════════════════════════════════

  /** Resolve a definition by DTO constructor or throw. */
  private resolveByDto<T>(dto: Type<T>): ISettingDefinition {
    const definition = this.registry.findByDto(dto);
    if (!definition) {
      throw new SettingsNotRegisteredError(dto.name);
    }
    return definition;
  }

  /**
   * Return the cached values for a group, populating the cache from
   * the backing store on first miss. Async stores hydrate in the
   * background — the initial return is the field-defaults record.
   *
   * IMPORTANT: returns the stored reference directly (frozen with
   * `Object.freeze`) — critical for `useSyncExternalStore`, which
   * uses `Object.is` to decide whether the store changed. Every
   * mutation writes a NEW object into `this.cache`, so identity
   * changes exactly when a value changes and never otherwise.
   * Callers that need to mutate the record must clone it themselves.
   */
  private getValues(definition: ISettingDefinition): Record<string, unknown> {
    const cached = this.cache.get(definition.key);
    if (cached) return cached;

    const defaults = resolveFieldDefaults(definition);
    const store = this.manager.storeForGroup(definition.key);
    const persisted = store.load(definition.key);

    if (persisted instanceof Promise) {
      // Prime the cache with defaults now so callers see something
      // meaningful before hydration completes. The promise merges
      // real values on top and notifies subscribers.
      const frozen = Object.freeze(defaults);
      this.cache.set(definition.key, frozen);
      this.trackHydration(definition.key, persisted, defaults);
      return frozen;
    }

    const merged = Object.freeze({ ...defaults, ...persisted });
    this.cache.set(definition.key, merged);
    return merged;
  }

  /**
   * Track an async hydration — coalesces concurrent triggers on the
   * same group and merges values into the cache once resolved.
   */
  private trackHydration(
    groupKey: string,
    persisted: Promise<Record<string, unknown>>,
    defaults: Record<string, unknown>,
  ): void {
    if (this.hydrationInFlight.has(groupKey)) return;

    const task = persisted
      .then((values) => {
        const merged = Object.freeze({ ...defaults, ...values });
        this.cache.set(groupKey, merged);
        this.notifyListeners(groupKey);
        this.emitChanged(groupKey, Object.keys(values), values, "remote");
      })
      .catch(() => {
        // fail-soft — the defaults are already in the cache; the
        // listener sees them and can retry via `hydrateValues` if the
        // caller wants.
      })
      .finally(() => {
        this.hydrationInFlight.delete(groupKey);
      });

    this.hydrationInFlight.set(groupKey, task);
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — persist
  // ══════════════════════════════════════════════════════════════════

  /**
   * Debounce a persist for one group. Coalescing keys is safe — the
   * store always sees the full merged snapshot.
   *
   * Also arms a deferred promise so `awaitPersist(groupKey)` callers
   * can join the pending cycle. The deferred replaces any prior
   * pending one — awaiters get the LATEST cycle's outcome, matching
   * user expectations ("the last write wins").
   */
  private schedulePersist(
    groupKey: string,
    values: Record<string, unknown>,
    changedKeys: readonly string[],
  ): void {
    // Arm a fresh deferred for this cycle. If there was a prior
    // pending deferred (its persist hadn't fired yet), resolve it
    // immediately — the awaiter would rather be told "your write
    // was superseded" than hang forever.
    const prior = this.persistDeferred.get(groupKey);
    if (prior) prior.resolve();
    const deferred = createDeferred();
    this.persistDeferred.set(groupKey, deferred);

    if (!this.config.debounce) {
      this.persist(groupKey, values, changedKeys);
      return;
    }

    const existing = this.persistTimers.get(groupKey);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.persistTimers.delete(groupKey);
      this.persist(groupKey, values, changedKeys);
    }, this.config.debounceMs);
    this.persistTimers.set(groupKey, timer);
  }

  /**
   * Fire the underlying store's `save` and route failures through
   * the event bus. Resolves the pending deferred for the group so
   * `awaitPersist` awaiters see the outcome.
   */
  private persist(
    groupKey: string,
    values: Record<string, unknown>,
    changedKeys: readonly string[],
  ): void {
    const store: ISettingsStore = this.manager.storeForGroup(groupKey);
    let result: void | Promise<void>;
    try {
      result = store.save(groupKey, values);
    } catch (error) {
      this.reportPersistError(groupKey, changedKeys, error);
      this.settleDeferred(groupKey, error);
      return;
    }
    if (result instanceof Promise) {
      result
        .then(() => this.settleDeferred(groupKey))
        .catch((error) => {
          this.reportPersistError(groupKey, changedKeys, error);
          this.settleDeferred(groupKey, error);
        });
      return;
    }
    // Sync path — resolve immediately.
    this.settleDeferred(groupKey);
  }

  /**
   * Settle the pending deferred for `groupKey` — with an error when
   * one is passed, otherwise as a success. No-op when no deferred
   * is armed.
   */
  private settleDeferred(groupKey: string, error?: unknown): void {
    const deferred = this.persistDeferred.get(groupKey);
    if (!deferred) return;
    this.persistDeferred.delete(groupKey);
    if (error !== undefined) {
      deferred.reject(error);
    } else {
      deferred.resolve();
    }
  }

  /** Emit a `SETTINGS_EVENTS.UPDATE_FAILED` and log the error. */
  private reportPersistError(
    groupKey: string,
    changedKeys: readonly string[],
    cause: unknown,
  ): void {
    const error = new SettingsUpdateFailedError(groupKey, changedKeys, cause);
    this.emitEvent(SETTINGS_EVENTS.UPDATE_FAILED, {
      group: groupKey,
      error,
      keys: changedKeys,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // PRIVATE — subscription + events
  // ══════════════════════════════════════════════════════════════════

  /** Fan out to every subscriber. Callback throws are swallowed. */
  private notifyListeners(groupKey: string): void {
    const bucket = this.listeners.get(groupKey);
    if (!bucket) return;
    for (const cb of bucket) {
      try {
        cb();
      } catch {
        // fail-soft — one bad listener never breaks the rest.
      }
    }
  }

  /** Emit `settings.changed` with a normalized payload. */
  private emitChanged(
    groupKey: string,
    keys: readonly string[],
    values: Record<string, unknown>,
    source: "local" | "remote",
  ): void {
    this.emitEvent(SETTINGS_EVENTS.CHANGED, {
      group: groupKey,
      keys,
      values,
      source,
    });
  }

  /** Emit an event through the optional bus. Fail-soft. */
  private emitEvent(event: string, payload: unknown): void {
    if (!this.events) return;
    void this.events.emit(event, payload).catch(() => {
      // fail-soft — event listeners never break the caller.
    });
  }
}
