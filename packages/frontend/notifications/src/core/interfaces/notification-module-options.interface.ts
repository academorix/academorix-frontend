/**
 * @file notification-module-options.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Root configuration shape for
 *   `NotificationModule.forRoot`.
 *
 *   The outer interface groups two nested config sections
 *   (`centre`, `push`). Both inner shapes live in the same file
 *   because they are used ONLY in service of the outer module
 *   options — this is the code-standards.md "composite family
 *   grouping" exception.
 */

/**
 * In-app notification centre config.
 */
export interface IInAppNotificationCentreConfig {
  /**
   * `@stackra/storage` instance name backing the durable queue.
   *
   * When omitted (or `'memory'`), the centre runs in-memory only —
   * suitable for a first-run PWA where nothing needs to survive a
   * page reload. Set to a persistent store (`'localStorage'`,
   * `'indexedDB'`, `'asyncStorage'`) when notifications must
   * survive reloads.
   *
   * @default undefined
   */
  readonly storage?: string;

  /**
   * Key inside the resolved `IStorage` under which the centre
   * serialises its queue.
   *
   * @default 'stackra:notifications:centre'
   */
  readonly storageKey?: string;

  /**
   * Hard ceiling on queue depth. Oldest items are evicted when new
   * dispatches would exceed this limit so a runaway push storm
   * cannot fill local storage.
   *
   * @default 100
   */
  readonly maxItems?: number;
}

/**
 * Web Push configuration — only consumed when the caller imports
 * `PushModule` (or `NotificationModule.forRoot({ push: {...} })`
 * transitively wires it).
 */
export interface IWebPushConfigOptions {
  /**
   * The VAPID public key issued by the app's push server. Required
   * for Web Push subscriptions.
   */
  readonly vapidPublicKey: string;

  /**
   * URL scope of the service worker whose registration owns the
   * subscription. Uses `'/'` when omitted.
   *
   * @default '/'
   */
  readonly serviceWorkerScope?: string;

  /**
   * User visibility hint passed to `PushManager.subscribe`. Most
   * browsers require `true` to accept the subscription.
   *
   * @default true
   */
  readonly userVisibleOnly?: boolean;
}

/**
 * Root `NotificationModule.forRoot` options.
 *
 * Every field is optional — `NotificationModule.forRoot()` with no
 * arguments yields a working memory-only configuration seeded from
 * `DEFAULT_NOTIFICATIONS_CONFIG`.
 */
export interface INotificationModuleOptions {
  /** In-app centre configuration. */
  readonly centre?: IInAppNotificationCentreConfig;
  /**
   * Web Push configuration. When provided, `NotificationModule.forRoot`
   * transitively imports `PushModule.forRoot(push)`.
   */
  readonly push?: IWebPushConfigOptions;
  /**
   * Channel ids the manager dispatches to when
   * `dispatch(payload)` is called without a `channels` override.
   *
   * @default ['in-app']
   */
  readonly defaultStack?: readonly string[];
}
