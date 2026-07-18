/**
 * @file analytics-bridge.service.ts
 * @module @stackra/pwa/core/services
 * @description Fan-out bridge that emits PWA lifecycle events through
 *   the app's optional {@link IAnalyticsManager} — the canonical token
 *   from `@stackra/contracts`.
 *
 *   The bridge is a thin fail-soft wrapper: when
 *   `@stackra/analytics`'s manager is registered, `emit(event, payload)`
 *   forwards through `manager.track(event, payload)` inside a
 *   `try/catch`; when it isn't, every emit is a silent no-op.
 *
 *   Consumers no longer need to write an adapter provider — merely
 *   importing `AnalyticsModule.forRoot({...})` in their `AppModule`
 *   makes every PWA lifecycle event flow through the analytics stack.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { ANALYTICS_MANAGER, type IAnalyticsManager } from '@stackra/contracts';

import type { PwaEventName } from '../constants';

/**
 * Fan-out bridge that dispatches PWA lifecycle events through the
 * app's `IAnalyticsManager`.
 *
 * The service is fail-soft: a throwing manager never propagates the
 * error to `PwaService`. Errors are swallowed by design so a broken
 * analytics stack cannot break the PWA runtime.
 *
 * @example
 * ```typescript
 * // In an app bootstrap — no adapter provider required:
 * @Module({
 *   imports: [
 *     AnalyticsModule.forRoot({ providers: { ga4: { measurementId: 'G-…' } } }),
 *     PwaModule.forRoot({}),
 *   ],
 * })
 * export class AppModule {}
 * ```
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
   *
   * Useful for consumers that want to avoid building a payload when
   * no downstream will consume it.
   */
  public isEnabled(): boolean {
    return this.manager != null;
  }

  /**
   * Emit a PWA lifecycle event. Silently swallows every downstream
   * error so a broken analytics manager never breaks the PWA runtime.
   *
   * @param event - Canonical event name from `PWA_EVENTS`.
   * @param payload - Optional event payload.
   */
  public emit(event: PwaEventName, payload?: Record<string, unknown>): void {
    if (!this.manager) return;
    try {
      // `track` typically returns `void`, but some managers (or
      // wrappers) may return a promise. We do not await it — the
      // fire-and-forget semantics match the rest of the analytics
      // stack — but we do attach a `.catch` when applicable so a
      // rejected promise doesn't surface as an unhandled-rejection
      // warning.
      const result = this.manager.track(event, payload) as unknown as void | Promise<unknown>;
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        (result as Promise<unknown>).catch(() => {
          // fail-soft — the bridge is best-effort.
        });
      }
    } catch {
      // fail-soft — the emit is best-effort by design. A throwing
      // provider inside the manager's fan-out has already been logged
      // by `@stackra/analytics` itself; we don't add another layer.
    }
  }
}
