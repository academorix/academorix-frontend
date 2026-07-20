/**
 * @file settings-module-options.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Root config shape for `SettingsModule.forRoot(options)`.
 *
 *   The composite family below (`ISettingsStoreConfig`,
 *   `IStorageStoreDriverConfig`, `IApiStoreDriverConfig`,
 *   `ISettingsGroupOverride`, `ISettingsApiEndpoints`,
 *   `ISettingsApiOptions`, `ISettingsBroadcastingOptions`,
 *   `ISettingsCacheOptions`, `ISettingsAuditOptions`) qualifies for
 *   the composite-family grouping exception in `code-standards.md`
 *   — every inner shape is used only in service of the outer.
 */

import type { SettingDriver } from "../../enums/setting-driver.enum";

// ═══════════════════════════════════════════════════════════════════════
// Store driver configs
// ═══════════════════════════════════════════════════════════════════════

/**
 * Driver-specific config for the built-in `storage` driver — wraps a
 * named `IStorage` instance from `@stackra/storage`.
 */
export interface IStorageStoreDriverConfig {
  readonly driver: SettingDriver.Storage | "storage";
  /**
   * Name of the `IStorage` instance in `STORAGE_MANAGER` this store
   * proxies to. Defaults to `'localStorage'` when omitted.
   */
  readonly storageInstance?: string;
  /**
   * Optional prefix appended to every group key before writing —
   * useful when two settings stores share the same `IStorage`
   * backing. Defaults to `config.prefix`.
   */
  readonly prefix?: string;
}

/**
 * Driver-specific config for the built-in `api` driver.
 */
export interface IApiStoreDriverConfig {
  readonly driver: SettingDriver.Api | "api";
  /**
   * Base URL. When omitted the store defers to the HTTP client's
   * baseUrl (typical setup).
   */
  readonly baseUrl?: string;
  /**
   * Named `IHttpClient` from `HTTP_MANAGER` this store dispatches
   * through. Defaults to `'default'` when omitted.
   */
  readonly httpClient?: string;
  /**
   * Extra headers — static or dynamic (invoked per request). Useful
   * for tenant / user scope hints.
   */
  readonly headers?: Record<string, string> | (() => Record<string, string>);
  /**
   * Additional query parameters injected on every request. Useful
   * for `?tenant_id=` / `?user_id=` hints when the caller wants to
   * override the auth-context default.
   */
  readonly query?: Record<string, string> | (() => Record<string, string>);
  /**
   * Retry policy — routed through `retry(fn, options)` from
   * `@stackra/support`. Defaults to `{ attempts: 3, backoff: 'exponential' }`.
   */
  readonly retry?: { readonly attempts?: number; readonly backoffMs?: number };
  /**
   * Store name to fall back to when the API is unreachable. Common
   * pattern: `'localStorage'`.
   */
  readonly fallbackStore?: string;
  /** Called when a request fails and no fallback is available. */
  readonly onError?: (error: Error, groupKey: string, operation: "load" | "save" | "clear") => void;
}

/**
 * Driver-specific config for the built-in `memory` driver. Present
 * for symmetry — the driver takes no options.
 */
export interface IMemoryStoreDriverConfig {
  readonly driver: SettingDriver.Memory | "memory";
}

/**
 * Discriminated union of built-in driver configs. Custom drivers
 * registered via `manager.extend(...)` widen the shape via the
 * final index-signature member.
 */
export type ISettingsStoreConfig =
  | IMemoryStoreDriverConfig
  | IStorageStoreDriverConfig
  | IApiStoreDriverConfig
  | { readonly driver: string; readonly [key: string]: unknown };

// ═══════════════════════════════════════════════════════════════════════
// Per-group override
// ═══════════════════════════════════════════════════════════════════════

/** Override which named store a specific group uses. */
export interface ISettingsGroupOverride {
  /** Instance name (key of `stores`). */
  readonly store: string;
}

// ═══════════════════════════════════════════════════════════════════════
// API sub-config
// ═══════════════════════════════════════════════════════════════════════

/**
 * Endpoint paths for the settings API — matches the Laravel Spatie
 * controller shape by default. Every path is a suffix appended to
 * the HTTP client's `baseUrl`.
 *
 * Supported placeholders:
 * - `{group}` — resolved settings group key.
 */
export interface ISettingsApiEndpoints {
  /** `GET {baseUrl}{schema}` — full schema for every group. */
  readonly schema?: string;
  /** `GET {baseUrl}{listGroups}` — all groups with resolved values. */
  readonly listGroups?: string;
  /** `GET {baseUrl}{getGroup}` (with `{group}` placeholder). */
  readonly getGroup?: string;
  /** `PUT {baseUrl}{updateGroup}` (with `{group}` placeholder). */
  readonly updateGroup?: string;
}

/** Options that govern the settings HTTP client behaviour. */
export interface ISettingsApiOptions {
  /**
   * Named `IHttpClient` from `HTTP_MANAGER` the schema loader and
   * the `api` driver dispatch through. Defaults to `'default'`.
   */
  readonly httpClient?: string;
  /**
   * Explicit base URL override. When omitted, the HTTP client's
   * configured baseUrl is used.
   */
  readonly baseUrl?: string;
  /** Endpoint path overrides. */
  readonly endpoints?: ISettingsApiEndpoints;
  /**
   * Whether the schema loader auto-fetches at `onModuleInit`. When
   * `false` (default), the app must call
   * `settingsService.loadSchema()` explicitly. Enable this once the
   * API is stable.
   */
  readonly autoLoadSchema?: boolean;
  /**
   * Whether the schema loader ALSO bulk-hydrates every group's
   * values after loading the schema, via `service.loadAll()`. Fires
   * one request to the `listGroups` endpoint (`GET /settings`)
   * regardless of group count. Requires `autoLoadSchema: true` to
   * take effect.
   *
   * @default `false`
   */
  readonly autoLoadValues?: boolean;
  /**
   * When set, the last-fetched schema is cached under
   * `STORAGE_MANAGER.instance(cacheSchemaStore)` for warm-start
   * hydration. `false` (default) keeps the schema in memory only.
   */
  readonly cacheSchemaStore?: string | false;
}

// ═══════════════════════════════════════════════════════════════════════
// Broadcasting sub-config
// ═══════════════════════════════════════════════════════════════════════

/**
 * Options that govern the realtime broadcast subscription. Requires
 * an optional `@stackra/realtime` peer at runtime.
 */
export interface ISettingsBroadcastingOptions {
  /** Master switch. Defaults to `false` (opt-in). */
  readonly enabled?: boolean;
  /**
   * Channel prefix. Public channels are `{prefix}.{group}`; tenant
   * private channels are `{prefix}.{group}.tenant.{tenantId}`.
   * Defaults to `'settings'` — matching Laravel's convention.
   */
  readonly channelPrefix?: string;
  /**
   * Named realtime connection to use (from `REALTIME_MANAGER`).
   * Defaults to `'default'`.
   */
  readonly connection?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Root options
// ═══════════════════════════════════════════════════════════════════════

/**
 * Root options accepted by `SettingsModule.forRoot`.
 */
export interface ISettingsModuleOptions {
  /**
   * Default store name — must match a key in `stores`.
   * @default `'localStorage'`
   */
  readonly default?: string;
  /**
   * Named store configurations keyed by instance name.
   *
   * @default
   * ```typescript
   * {
   *   memory:       { driver: 'memory' },
   *   localStorage: { driver: 'storage', storageInstance: 'localStorage' },
   * }
   * ```
   */
  readonly stores?: Readonly<Record<string, ISettingsStoreConfig>>;
  /**
   * Global key prefix passed to storage-backed drivers.
   * @default `'stackra:settings'`
   */
  readonly prefix?: string;
  /**
   * Per-group store overrides. Keys are group keys, values pick a
   * named store other than `default`.
   */
  readonly groups?: Readonly<Record<string, ISettingsGroupOverride>>;
  /**
   * Whether writes are debounced before being persisted to the
   * underlying store.
   * @default `true`
   */
  readonly debounce?: boolean;
  /**
   * Debounce delay in milliseconds. Ignored when `debounce` is
   * `false`.
   * @default `300`
   */
  readonly debounceMs?: number;
  /** API sub-config (schema loader + `api` driver defaults). */
  readonly api?: ISettingsApiOptions;
  /** Realtime broadcast sub-config. */
  readonly broadcasting?: ISettingsBroadcastingOptions;
}

/**
 * The merged, defaults-applied form of the API sub-config. Every
 * nested field is guaranteed present after `mergeConfig` has run.
 */
export interface ISettingsResolvedApi {
  readonly httpClient: string;
  readonly endpoints: Required<ISettingsApiEndpoints>;
  readonly autoLoadSchema: boolean;
  readonly autoLoadValues: boolean;
  readonly cacheSchemaStore: string | false;
  readonly baseUrl?: string;
}

/**
 * The merged, defaults-applied form of the broadcasting sub-config.
 */
export interface ISettingsResolvedBroadcasting {
  readonly enabled: boolean;
  readonly channelPrefix: string;
  readonly connection: string;
}

/**
 * The merged, defaults-applied form of {@link ISettingsModuleOptions}
 * bound under the `SETTINGS_CONFIG` DI token.
 *
 * @remarks Every nested field is defaults-populated after
 *   `mergeConfig(options?)` has run.
 */
export interface ISettingsConfig {
  readonly default: string;
  readonly stores: Readonly<Record<string, ISettingsStoreConfig>>;
  readonly prefix: string;
  readonly groups?: Readonly<Record<string, ISettingsGroupOverride>>;
  readonly debounce: boolean;
  readonly debounceMs: number;
  readonly api: ISettingsResolvedApi;
  readonly broadcasting: ISettingsResolvedBroadcasting;
}
