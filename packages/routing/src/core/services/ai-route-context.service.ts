/**
 * @file ai-route-context.service.ts
 * @module @stackra/routing/core/services
 * @description Stub AI route context service — placeholder for F.2/G.
 *
 *   The real integration wires `<AiRouteContext>` into
 *   `@stackra/ai`'s context registry so an AI agent can answer "where
 *   am I?" from the current match chain. F.1 ships only the DI
 *   binding target so the `AI_ROUTE_CONTEXT` contract token has a
 *   concrete class to resolve.
 *
 *   The stub holds a boolean flag lifted from
 *   `IRoutingModuleOptions.ai`. Consumers who inject it can check the
 *   flag; the flag is `false` unless the app explicitly opts in.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { ILoggerManager, IRoutingModuleOptions } from "@stackra/contracts";
import { LOGGER_MANAGER, ROUTING_CONFIG } from "@stackra/contracts";

/**
 * AI route-context service (stub).
 *
 * TODO(F.2/G): wire to `@stackra/ai`'s context registry.
 * @see PLAN v3.8 for the target integration surface.
 */
@Injectable()
export class AiRouteContextService {
  /** Whether AI integration is enabled per module config. */
  private readonly enabled: boolean;

  public constructor(
    @Optional() @Inject(ROUTING_CONFIG) config?: IRoutingModuleOptions,
    @Optional()
    @Inject(LOGGER_MANAGER)
    // Optional logger — the F.2 hook that snapshots the match chain
    // will log via this channel when an AI-context registration
    // fails, so the field is wired now to avoid touching the ctor
    // signature later.
    private readonly loggerManager?: ILoggerManager,
  ) {
    this.enabled = config?.ai === true;
    // Debug — surface the wire-up state so devs can confirm the
    // module is doing what they asked at boot time.
    this.debug(
      this.enabled
        ? "AI route context enabled (RoutingModule.forRoot({ai: true}))."
        : "AI route context disabled — the service is a stub until F.2.",
    );
  }

  /**
   * Whether AI integration is enabled.
   *
   * @returns `true` when `RoutingModule.forRoot({ ai: true })` was set.
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Snapshot the current route context.
   *
   * F.1 returns `null` — the real implementation in F.2 reads the
   * match chain from RRv7's `useMatches()` and produces an AI-friendly
   * frame.
   *
   * @returns Placeholder — always `null` in F.1.
   */
  public getCurrentContext(): unknown {
    return null;
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Emit a debug-level log. Fail-soft — the service must survive
   * without a logger wired.
   */
  private debug(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.ai").debug(message);
    } catch {
      // fail-soft — logger failures are never fatal here.
    }
  }
}
