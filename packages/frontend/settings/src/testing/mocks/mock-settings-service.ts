/**
 * @file mock-settings-service.ts
 * @module @stackra/settings/testing/mocks
 * @description Test-focused `ISettingsService` implementation.
 *
 *   The real `SettingsService` needs a full DI graph. This mock is a
 *   drop-in for tests that just want to feed values into a component
 *   and observe reads / writes without wiring the module.
 */

import type {
  ISettingDefinition,
  ISettingsService,
  SettingsSubscriber,
  SettingsUnsubscribe,
  Type,
} from '@stackra/contracts';

/**
 * Ephemeral, purely in-memory `ISettingsService` for tests.
 *
 * Behavioural differences from the real service:
 * - No debounce — writes apply immediately.
 * - No persistence layer — the cache IS the store.
 * - No event bus — subscribers are notified directly.
 *
 * @example
 * ```typescript
 * import { MockSettingsService, MockSettingsRegistry } from '@stackra/settings/testing';
 *
 * const registry = new MockSettingsRegistry();
 * registry.registerFromSchema({ key: 'display', label: 'Display', dto: null, fields: [], groups: [] });
 *
 * const service = new MockSettingsService(registry, {
 *   display: { compact: true },
 * });
 *
 * expect(service.getByKey('display')).toEqual({ compact: true });
 * ```
 */
export class MockSettingsService implements ISettingsService {
  private readonly cache: Map<string, Record<string, unknown>>;

  private readonly listeners = new Map<string, Set<SettingsSubscriber>>();

  /**
   * @param registry - Registry used for definition lookups + DTO
   *   → key resolution.
   * @param seed - Optional seed values keyed by group.
   */
  public constructor(
    private readonly registry: {
      readonly get: (key: string) => ISettingDefinition | undefined;
      readonly findByDto: (dto: Type) => ISettingDefinition | undefined;
      readonly all: () => readonly ISettingDefinition[];
      readonly has: (key: string) => boolean;
    },
    seed: Record<string, Record<string, unknown>> = {}
  ) {
    this.cache = new Map(Object.entries(seed));
  }

  // ══════════════════════════════════════════════════════════════════
  // READ
  // ══════════════════════════════════════════════════════════════════

  /**
   * Per-group snapshot cache — keyed by group key. Rebuilt on write
   * so `useSyncExternalStore` identity checks stay reliable.
   */
  private readonly snapshots = new Map<string, Readonly<Record<string, unknown>>>();

  public get<T>(dto: Type<T>): T {
    const definition = this.registry.findByDto(dto);
    if (!definition) {
      throw new Error(`[MockSettingsService] "${dto.name}" is not registered.`);
    }
    return this.snapshotFor(definition.key, definition) as T;
  }

  public getByKey(groupKey: string): Record<string, unknown> | undefined {
    const definition = this.registry.get(groupKey);
    if (!definition) return undefined;
    return this.snapshotFor(groupKey, definition);
  }

  /**
   * Return the frozen snapshot for a group, rebuilding it only when
   * the cache invalidator fired since the last read.
   */
  private snapshotFor(
    groupKey: string,
    definition: ISettingDefinition
  ): Readonly<Record<string, unknown>> {
    const cached = this.snapshots.get(groupKey);
    if (cached) return cached;
    const frozen = Object.freeze({
      ...defaults(definition),
      ...(this.cache.get(groupKey) ?? {}),
    });
    this.snapshots.set(groupKey, frozen);
    return frozen;
  }

  public getGroups(): readonly ISettingDefinition[] {
    return this.registry.all();
  }

  public getGroup(key: string): ISettingDefinition | undefined {
    return this.registry.get(key);
  }

  // ══════════════════════════════════════════════════════════════════
  // WRITE
  // ══════════════════════════════════════════════════════════════════

  public set<T>(dto: Type<T>, key: keyof T & string, value: unknown): void {
    const definition = this.registry.findByDto(dto);
    if (!definition) return;
    this.setByKey(definition.key, key, value);
  }

  public setMany<T>(dto: Type<T>, partial: Partial<T>): void {
    const definition = this.registry.findByDto(dto);
    if (!definition) return;
    this.setManyByKey(definition.key, partial as Record<string, unknown>);
  }

  public setByKey(groupKey: string, fieldKey: string, value: unknown): void {
    this.setManyByKey(groupKey, { [fieldKey]: value });
  }

  public setManyByKey(groupKey: string, values: Record<string, unknown>): void {
    const current = this.cache.get(groupKey) ?? {};
    this.cache.set(groupKey, { ...current, ...values });
    this.snapshots.delete(groupKey);
    this.notify(groupKey);
  }

  public reset<T>(dto: Type<T>): void {
    const definition = this.registry.findByDto(dto);
    if (definition) this.resetByKey(definition.key);
  }

  public resetByKey(groupKey: string): void {
    this.cache.delete(groupKey);
    this.snapshots.delete(groupKey);
    this.notify(groupKey);
  }

  // ══════════════════════════════════════════════════════════════════
  // HYDRATE / EXPORT / IMPORT
  // ══════════════════════════════════════════════════════════════════

  public hydrateValues(groupKey: string, values: Record<string, unknown>): void {
    const current = this.cache.get(groupKey) ?? {};
    this.cache.set(groupKey, { ...current, ...values });
    this.snapshots.delete(groupKey);
    this.notify(groupKey);
  }

  public hydrateAll(data: Record<string, Record<string, unknown>>): void {
    for (const [key, values] of Object.entries(data)) this.hydrateValues(key, values);
  }

  /**
   * Test-friendly `loadAll` — replays the internal cache as a
   * hydration payload. Callers can seed the mock via the constructor
   * or `hydrateAll` and `loadAll()` will surface the same values back.
   */
  public async loadAll(): Promise<void> {
    // No-op in the mock — the cache IS the store. This method exists
    // for interface parity so components under test can call it
    // without a runtime error.
  }

  /**
   * Test-friendly `awaitPersist` — resolves immediately. The mock
   * has no debounce or async store, so there is no persist cycle
   * to await. Tests that need to observe rejection semantics use a
   * throw-on-persist store instead.
   */
  public awaitPersist(_groupKey: string): Promise<void> {
    return Promise.resolve();
  }

  public exportAll(): Record<string, Record<string, unknown>> {
    const snapshot: Record<string, Record<string, unknown>> = {};
    for (const [key, values] of this.cache) snapshot[key] = { ...values };
    return snapshot;
  }

  public importAll(data: Record<string, Record<string, unknown>>): void {
    for (const [key, values] of Object.entries(data)) {
      if (this.registry.has(key)) this.setManyByKey(key, values);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // SUBSCRIBE
  // ══════════════════════════════════════════════════════════════════

  public subscribe(groupKey: string, callback: SettingsSubscriber): SettingsUnsubscribe {
    let bucket = this.listeners.get(groupKey);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(groupKey, bucket);
    }
    bucket.add(callback);
    return () => {
      bucket?.delete(callback);
    };
  }

  private notify(groupKey: string): void {
    const bucket = this.listeners.get(groupKey);
    if (!bucket) return;
    for (const cb of bucket) {
      try {
        cb();
      } catch {
        // fail-soft — tests should assert on state, not on listener throws.
      }
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Build the defaults record for a definition. */
function defaults(definition: ISettingDefinition): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const field of definition.fields) record[field.key] = field.defaultValue;
  return record;
}
