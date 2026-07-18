/**
 * @file route-matcher.service.ts
 * @module @stackra/routing/core/services
 * @description Evaluates an `IMatcherContext` against a route's `match`
 *   block (subdomain / query / header / hash / custom).
 *
 *   `RouteMatcherService.match(spec, ctx)` returns `true` if every
 *   present predicate matches. When `custom` is async, `match` returns
 *   a `Promise<boolean>`; otherwise it returns `boolean` synchronously
 *   (the sync path is important for the F.2 useNavigate() shortcut).
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { ILoggerManager, IMatcherContext, IRouteRecord } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

/**
 * The routing matcher.
 *
 * @example
 * ```typescript
 * const matcher = app.get<RouteMatcherService>(ROUTE_MATCHER);
 * matcher.match(route.match, ctx);
 * ```
 */
@Injectable()
export class RouteMatcherService {
  public constructor(
    @Optional()
    @Inject(LOGGER_MANAGER)
    // Optional logger — the matcher itself is stateless, but a
    // failing `custom` predicate is a debugging pain-point. Wiring
    // the logger here keeps the same fail-soft warn shape used by
    // every other routing service.
    private readonly loggerManager?: ILoggerManager,
  ) {}

  /**
   * Match an incoming `IMatcherContext` against a route's `match` spec.
   *
   * @param spec - The route's `match` block. When `undefined` or empty,
   *   every context is considered a match.
   * @param ctx  - Runtime matcher context (subdomain, query, headers…).
   * @returns `true` if every present predicate matches. Async `custom`
   *   returns a `Promise<boolean>`.
   */
  public match(
    spec: IRouteRecord["match"] | undefined,
    ctx: IMatcherContext,
  ): boolean | Promise<boolean> {
    if (!spec) return true;

    // Subdomain — bail early on the cheapest check.
    if (spec.subdomain && !spec.subdomain(ctx.subdomain)) return false;
    // Query — same shape.
    if (spec.query && !spec.query(ctx.query)) return false;
    // Header — same shape.
    if (spec.header && !spec.header(ctx.headers)) return false;
    // Hash — same shape.
    if (spec.hash && !spec.hash(ctx.hash)) return false;

    // Custom — may be async. The plan restricts custom matchers to
    // runtime only (never at build time — see PLAN v3.4). We honour
    // the return type: sync `boolean` stays sync; a `Promise` bubbles
    // up so the caller can `await`. A synchronous throw is caught
    // here and logged; the matcher treats a thrown predicate as a
    // non-match to avoid corrupting the resolution pass.
    if (spec.custom) {
      try {
        const result = spec.custom(ctx);
        // A `Promise<boolean>` wraps the whole chain; the caller
        // decides whether to await. Attach a `.catch` so async
        // failures also warn via the logger without bubbling into
        // the resolver.
        if (result instanceof Promise) {
          return result.catch((error: unknown) => {
            this.warn(`custom matcher threw asynchronously: ${String(error)}`);
            return false;
          });
        }
        return result;
      } catch (error) {
        this.warn(`custom matcher threw synchronously: ${String(error)}`);
        return false;
      }
    }

    return true;
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Emit a warning through the optional logger. Fail-soft — the
   * matcher must survive without a logger wired.
   */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.matcher").warn(message);
    } catch {
      // fail-soft — never let a logger failure break matching.
    }
  }
}
