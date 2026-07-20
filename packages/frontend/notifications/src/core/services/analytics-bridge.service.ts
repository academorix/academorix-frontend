/**
 * @file analytics-bridge.service.ts
 * @module @stackra/notifications/core/services
 * @description Fan-out bridge that emits notifications lifecycle
 *   events through the app's optional `IAnalyticsManager`.
 *
 *   Identical pattern to the pwa analytics bridge: bind directly
 *   against `ANALYTICS_MANAGER` from `@stackra/contracts`, wrap
 *   `manager.track(...)` in a try/catch, attach a `.catch` on any
 *   thenable return so a rejected promise doesn't surface as an
 *   unhandled-rejection warning. When no manager is registered,
 *   every emit is a silent no-op.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { ANALYTICS_MANAGER, type IAnalyticsManager } from '@stackra/contracts';

import type { NotificationEventName } from '../constants';

/**
 * Fan-out bridge that dispatches notifications lifecycle events
 * through the app's `IAnalyticsManager`.
 *
 * Fail-soft by design — a throwing manager never propagates the
 * error to the caller. Consumers who don't ship `@stackra/analytics`
 * can still resolve every service in this module; every emit turns
 * into a no-op.
 */
@Injectable()
export class AnalyticsBridgeService {
  /**
   * @param manager - Optional analytics manager. When absent (no
   *   `AnalyticsModule` in the app), every `emit()` is a no-op.
   */
  public constructor(
    @Optional()
    @Inject(ANALYTICS_MANAGER)
    private readonly manager?: IAnalyticsManager | null
  ) {}

  /**
   * Whether an analytics manager is registered.
   */
  public isEnabled(): boolean {
    return this.manager != null;
  }

  /**
   * Emit a notifications lifecycle event. Silently swallows every
   * downstream error so a broken analytics manager cannot break the
   * notifications runtime.
   *
   * @param event - Canonical event name from `NOTIFICATION_EVENTS`.
   * @param payload - Optional event payload.
   */
  public emit(event: NotificationEventName, payload?: Record<string, unknown>): void {
    if (!this.manager) return;
    try {
      // `track` typically returns `void`, but some wrappers may
      // return a promise. Fire-and-forget semantics match the rest
      // of the analytics stack.
      const result = this.manager.track(event, payload) as unknown as void | Promise<unknown>;
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        (result as Promise<unknown>).catch(() => {
          // fail-soft — the bridge is best-effort.
        });
      }
    } catch {
      // fail-soft — the emit is best-effort by design.
    }
  }
}
