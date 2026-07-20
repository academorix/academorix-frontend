/**
 * @file app-update-config.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Configuration for {@link AppUpdateService} —
 *   backend-published app releases (semver bumps + mandatory-update
 *   flags + platform-specific download URLs).
 *
 *   Distinct from `IPwaUpdateConfig`, which governs the *service
 *   worker* update flow. This one drives an HTTP fetch + optional
 *   realtime subscription against the backend "app updates"
 *   endpoint.
 */

/**
 * Endpoint path templates for the app-update HTTP surface.
 *
 * @example
 * ```typescript
 * endpoints: { version: '/api/v1/app/version' }
 * ```
 */
export interface IAppUpdateEndpoints {
  /**
   * `GET` — returns the current release manifest. Defaults to
   * `/api/v1/app/version` (matches the Laravel `AppVersionController`
   * convention).
   */
  readonly version?: string;
}

/**
 * Configuration for `AppUpdateService`.
 *
 * All fields are optional — omitting the section entirely disables
 * the service. Callers that only need the reactive state (without
 * polling) can pass an empty `{}` and drive checks manually via
 * `AppUpdateService.check()`.
 */
export interface IAppUpdateConfig {
  /**
   * Named `HTTP_MANAGER` connection to use for the `version` fetch.
   * Falls back to the manager's default connection when omitted.
   */
  readonly httpClient?: string;

  /**
   * Endpoint path template overrides. Defaults are Laravel-friendly
   * paths (`/api/v1/app/version`).
   */
  readonly endpoints?: IAppUpdateEndpoints;

  /**
   * Optional base URL prepended to `endpoints.version`. When absent,
   * the HTTP client's configured base URL is used verbatim.
   */
  readonly baseUrl?: string;

  /**
   * Poll interval in milliseconds for periodic version checks. When
   * omitted or `<= 0`, polling is disabled and the service relies on
   * realtime broadcasts + explicit `check()` calls.
   *
   * @default `0` (disabled)
   */
  readonly pollingIntervalMs?: number;

  /**
   * Whether to fire one `check()` right after the module boots.
   * Runs during `onModuleInit` (or `onApplicationBootstrap` when
   * `broadcasting.enabled` is true, so broadcast subscriptions
   * settle first).
   *
   * @default `true`
   */
  readonly checkOnBoot?: boolean;

  /**
   * Realtime subscription for the `app.updates` channel. When
   * enabled, the service subscribes on
   * `onApplicationBootstrap` and merges incoming manifests into
   * the reactive state — no polling required.
   */
  readonly broadcasting?: {
    /**
     * Master switch. `false` disables the subscription (default).
     * Requires the optional `@stackra/realtime` peer at runtime.
     */
    readonly enabled?: boolean;

    /**
     * Named realtime connection. Defaults to `'default'`.
     */
    readonly connection?: string;

    /**
     * Channel name — matches the Laravel `AppUpdateEvent` broadcast
     * channel. Defaults to `'app.updates'`.
     */
    readonly channel?: string;
  };

  /**
   * Current app version. Used to compare against the fetched
   * manifest's `current_version` to decide whether an update is
   * available. Callers typically wire this from `import.meta.env.APP_VERSION`
   * or a build-time constant.
   */
  readonly currentVersion?: string;

  /**
   * Which platform this build targets. The service picks the
   * matching download URL from the manifest. Defaults to `'web'`.
   */
  readonly platform?: "web" | "desktop" | "mobile";
}
