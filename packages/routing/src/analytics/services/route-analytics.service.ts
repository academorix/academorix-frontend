/**
 * @file route-analytics.service.ts
 * @module @stackra/routing/analytics/services
 * @description Fires the current route's `analytics` event through
 *   `IAnalyticsManager`.
 *
 *   Framework-agnostic. The F.2 `useRouteAnalytics()` hook subscribes
 *   to the router's `useMatches()` output and calls
 *   `RouteAnalyticsService.emitForMatch(...)` on every navigation.
 *
 *   `IAnalyticsManager` is an optional dependency — apps without
 *   analytics wire nothing, and the service becomes a no-op.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { IAnalyticsManager, ILoggerManager } from "@stackra/contracts";
import { ANALYTICS_MANAGER, LOGGER_MANAGER } from "@stackra/contracts";

import { resolveValue } from "@/core/utils/resolve-value.util";

/**
 * Shape the route's `analytics` field must resolve to.
 *
 * Not exported publicly — this is the narrow shape the service reads.
 * The `page.analytics` field in `IPageConfig` is typed `unknown` at the
 * contract level; the F.2 typed-event catalogue will refine it via
 * `defineEvents(...)` from `@stackra/analytics`.
 */
interface IAnalyticsEvent {
  readonly name: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

/**
 * The route-analytics service.
 */
@Injectable()
export class RouteAnalyticsService {
  public constructor(
    @Optional()
    @Inject(ANALYTICS_MANAGER)
    private readonly manager?: IAnalyticsManager,
    @Optional()
    @Inject(LOGGER_MANAGER)
    private readonly loggerManager?: ILoggerManager,
  ) {}

  /**
   * Emit the analytics event for a resolved page context.
   *
   * @param event   - The route's `analytics` field — static event or
   *   factory `(ctx) => event`.
   * @param context - The page context (matched loader data + params).
   */
  public emit<TContext>(
    event: unknown | ((ctx: TContext) => unknown) | undefined,
    context: TContext,
  ): void {
    if (!this.manager) return;
    // Resolve the "value OR function" shape into a concrete event.
    const resolved = resolveValue(event, context) as IAnalyticsEvent | undefined;
    if (!resolved || !resolved.name) return;
    try {
      this.manager.track(resolved.name, resolved.properties as Record<string, unknown>);
    } catch (error) {
      // fail-soft — analytics errors never break the app.
      this.warn(`Analytics track for '${resolved.name}' threw: ${String(error)}`);
    }
  }

  /** Emit a warning through the optional logger. Fail-soft. */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.analytics").warn(message);
    } catch {
      // fail-soft
    }
  }
}
