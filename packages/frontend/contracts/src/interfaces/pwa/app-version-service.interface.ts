/**
 * @file app-version-service.interface.ts
 * @module @stackra/contracts/interfaces/pwa
 * @description Contract for the app-version service exposed by
 *   `@stackra/pwa` under the `APP_VERSION_SERVICE` token.
 *
 *   Consumers subscribe to snapshot changes to render prompts,
 *   analytics events, or gating logic. The service transparently
 *   handles the initial HTTP fetch and the realtime subscription;
 *   callers only see a synchronous snapshot + subscription pair.
 */

import type { IAppVersion } from "./app-version.interface";

/**
 * Compact staleness verdict computed from a snapshot + the running
 * client version.
 */
export interface IAppVersionStaleness {
  /** Whether the client is older than `minVersion` (usage blocked). */
  readonly mandatoryUpdate: boolean;
  /** Whether the client is older than `currentVersion` (update available). */
  readonly updateAvailable: boolean;
  /** Version string the client identifies as. */
  readonly runningVersion: string;
}

/**
 * Callback signature for {@link IAppVersionService.subscribe}.
 */
export type AppVersionSubscriber = (snapshot: IAppVersion | null) => void;

/**
 * Unsubscribe handle returned by {@link IAppVersionService.subscribe}.
 */
export type AppVersionUnsubscribe = () => void;

/**
 * Public contract for the app-version service.
 *
 * @example
 * ```typescript
 * import { APP_VERSION_SERVICE, type IAppVersionService } from '@stackra/contracts';
 *
 * class GatingService {
 *   public constructor(
 *     @Inject(APP_VERSION_SERVICE) private readonly appVersion: IAppVersionService,
 *   ) {}
 *
 *   isBlocked() {
 *     return this.appVersion.getStaleness().mandatoryUpdate;
 *   }
 * }
 * ```
 */
export interface IAppVersionService {
  /**
   * The last-known snapshot. `null` before the initial fetch has
   * completed (or when the endpoint is unavailable and no snapshot
   * has ever arrived via broadcast).
   */
  getSnapshot(): IAppVersion | null;

  /**
   * Staleness verdict comparing the running client version to the
   * latest snapshot. Returns a safe default when no snapshot is
   * known.
   */
  getStaleness(): IAppVersionStaleness;

  /**
   * Manually refresh the snapshot from the HTTP endpoint. Normally
   * not needed — the service fetches at `onModuleInit` and follows
   * realtime broadcasts thereafter.
   */
  refresh(): Promise<IAppVersion | null>;

  /**
   * Subscribe to snapshot changes. Fires immediately with the
   * current value, then on every update (fetch, broadcast, or manual
   * refresh). Returns an unsubscribe handle.
   */
  subscribe(callback: AppVersionSubscriber): AppVersionUnsubscribe;
}
