/**
 * @file index.ts
 * @module @stackra/routing/testing
 * @description Public API for the `@stackra/routing/testing` subpath.
 *
 *   Ships DI/context/guard/middleware fixtures for unit tests + the
 *   programmatic test router and assertion helpers (per PLAN
 *   v3.11.5).
 */

export { createMockContainer, type IMockContainer } from "./create-mock-container.util";
export {
  createMockGuardContext,
  type IMockGuardContextOverrides,
} from "./create-mock-guard-context.util";
export {
  createMockMatcherContext,
  type IMockMatcherContextOverrides,
} from "./create-mock-matcher-context.util";
export { runGuard } from "./run-guard.util";
export { runMiddleware, type IRunMiddlewareOptions } from "./run-middleware.util";

// ── F.2 additions ───────────────────────────────────────────────
export {
  createTestRouter,
  type ITestRouter,
  type ICreateTestRouterOptions,
} from "./create-test-router.util";
export { mockNavigate, type IMockNavigate, type INavigateCall } from "./mock-navigate.util";
export { expectRoute } from "./expect-route.util";
export { expectMatched } from "./expect-matched.util";
export { expectGuardBlocked } from "./expect-guard-blocked.util";

// ── F.3 additions ───────────────────────────────────────────────
export {
  createMockPrerenderContext,
  type IMockPrerenderContextOverrides,
} from "./mock-prerender-context.util";

// ── React render helpers ────────────────────────────────────────
export {
  renderWithRouting,
  type IRenderWithRoutingOptions,
  type IRenderWithRoutingResult,
} from "./render-with-routing.util";
export {
  RoutingTestFrame,
  type IRoutingTestFrameProps,
} from "./routing-test-frame.util";
