/**
 * @file settings-service.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description The public `ISettingsService` contract — high-level
 *   read / write / subscribe API consumers interact with.
 *
 *   Combines the DTO-based flavor (`get(dto)`, `set(dto, key, value)`)
 *   and the key-based flavor (`getByKey`, `setByKey`) so both
 *   client-declared and server-declared groups are addressable
 *   through a single service.
 */

import type { Type } from "../type.interface";
import type { ISettingDefinition } from "./setting-definition.interface";

/**
 * Callback fired when any field in the referenced group changes
 * (local `set`, `reset`, hydrate, or realtime broadcast).
 */
export type SettingsSubscriber = () => void;

/**
 * Unsubscribe handle returned by {@link ISettingsService.subscribe}.
 */
export type SettingsUnsubscribe = () => void;

/**
 * The public API for the settings package.
 *
 * @example
 * ```typescript
 * import { SETTINGS_SERVICE, type ISettingsService } from '@stackra/contracts';
 *
 * class SettingsPanel {
 *   public constructor(
 *     @Inject(SETTINGS_SERVICE) private readonly settings: ISettingsService,
 *   ) {}
 *
 *   getDisplay() {
 *     return this.settings.get(DisplaySettings);
 *   }
 * }
 * ```
 */
export interface ISettingsService {
  // ───────────────────────────────────────────────────────────────
  // READ
  // ───────────────────────────────────────────────────────────────

  /**
   * Get the current values for a group by DTO constructor.
   * Returns the DTO shape, populated with defaults for any field
   * that has not been set. Reads are synchronous — async stores
   * hydrate in the background and notify subscribers on completion.
   */
  get<T>(dto: Type<T>): T;

  /**
   * Get the current values for a group by key. Returns `undefined`
   * when the group is not registered.
   */
  getByKey(groupKey: string): Record<string, unknown> | undefined;

  /** Every registered group definition (sorted by order). */
  getGroups(): readonly ISettingDefinition[];

  /** Look up a registered group by key. */
  getGroup(key: string): ISettingDefinition | undefined;

  // ───────────────────────────────────────────────────────────────
  // WRITE
  // ───────────────────────────────────────────────────────────────

  /** Update a single field on a DTO-registered group. */
  set<T>(dto: Type<T>, key: keyof T & string, value: unknown): void;

  /** Update many fields on a DTO-registered group. */
  setMany<T>(dto: Type<T>, partial: Partial<T>): void;

  /** Update a single field by group key. */
  setByKey(groupKey: string, fieldKey: string, value: unknown): void;

  /** Update many fields by group key. */
  setManyByKey(groupKey: string, values: Record<string, unknown>): void;

  /** Reset a DTO-registered group back to declared defaults. */
  reset<T>(dto: Type<T>): void;

  /** Reset a group by key. */
  resetByKey(groupKey: string): void;

  // ───────────────────────────────────────────────────────────────
  // HYDRATION
  // ───────────────────────────────────────────────────────────────

  /**
   * Merge freshly-fetched values into the cache without triggering
   * a persist. Used by the schema loader and broadcast listener.
   */
  hydrateValues(groupKey: string, values: Record<string, unknown>): void;

  /** Bulk-hydrate multiple groups. */
  hydrateAll(data: Record<string, Record<string, unknown>>): void;

  /**
   * Resolve when the pending persist for `groupKey` completes.
   *
   * Every mutation (`set`, `setMany`, `setByKey`, `setManyByKey`)
   * schedules a debounced persist against the group's store. This
   * method returns a promise that resolves once that persist has
   * actually run — the store's `save` succeeded, and the debounce
   * timer has cleared. Callers that need to know a write hit the
   * server before showing a success toast use this.
   *
   * Resolves immediately when no persist is scheduled or in flight.
   * Rejects when the persist failed (network error, permission
   * denied, etc.).
   *
   * @param groupKey - Group key to await.
   * @returns Promise resolving after the persist completes.
   */
  awaitPersist(groupKey: string): Promise<void>;

  /**
   * Fetch every registered group's values in one round trip and
   * hydrate them into the local cache.
   *
   * Prefers the default store's optional `loadAll()` primitive
   * (`api` driver hits `GET /settings` in one call). When absent,
   * falls back to per-group `load()` across every registered group.
   *
   * Fail-soft — a network failure is logged; the service continues
   * with whatever the cache already holds. Safe to call from
   * `onModuleInit` / `onApplicationBootstrap`.
   */
  loadAll(): Promise<void>;

  // ───────────────────────────────────────────────────────────────
  // EXPORT / IMPORT
  // ───────────────────────────────────────────────────────────────

  /** JSON snapshot of every registered group's current values. */
  exportAll(): Record<string, Record<string, unknown>>;

  /**
   * Merge an imported snapshot into current values. Does not remove
   * fields absent from the import.
   */
  importAll(data: Record<string, Record<string, unknown>>): void;

  // ───────────────────────────────────────────────────────────────
  // SUBSCRIBE
  // ───────────────────────────────────────────────────────────────

  /**
   * Subscribe to changes for one group. Returns an unsubscribe
   * function.
   */
  subscribe(groupKey: string, callback: SettingsSubscriber): SettingsUnsubscribe;
}
