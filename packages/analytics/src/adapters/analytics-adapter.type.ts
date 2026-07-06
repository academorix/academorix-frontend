/**
 * @file analytics-adapter.type.ts
 * @module @academorix/analytics/adapters/analytics-adapter.type
 *
 * @description
 * The pluggable adapter contract every analytics backend implements.
 * Vercel Analytics, PostHog, Sentry, and the dev-only console adapter
 * all satisfy this interface — the AnalyticsProvider composes zero or
 * more of them and fan-outs every call.
 *
 * Design goals:
 *  - **Fan-out over hard integration**. We do NOT couple to a specific
 *    SDK; we call every configured adapter in order. Adding a new
 *    provider is an adapter file + a config change.
 *  - **Non-blocking**. All methods are void-returning. Adapters may
 *    fire-and-forget internally; callers never await.
 *  - **Server-safe**. Adapters MAY be called on the server (Next.js
 *    Server Components). Adapters that need `window`/DOM guard
 *    themselves.
 *  - **Small surface**. Just track / identify / page / reset. Anything
 *    provider-specific goes into event properties.
 */

/**
 * Free-form serialisable properties attached to an event.
 *
 * We type as `unknown` (not `any`) so adapters that need to `JSON.stringify`
 * get the compile error early. Callers should pass primitives + plain
 * objects only.
 */
export type AnalyticsProperties = Readonly<Record<string, unknown>>;

/**
 * User identity payload sent to `identify`. `id` is required; every
 * other field is optional and vendor-specific.
 */
export interface AnalyticsIdentity {
  readonly id: string;
  readonly email?: string;
  readonly name?: string;
  readonly tenantId?: string;
  readonly role?: string;
  readonly locale?: string;
  readonly [key: string]: unknown;
}

/**
 * Page-view payload. `path` is required; every adapter needs at least
 * that. Other fields let adapters differentiate marketing vs product
 * pageviews without a global feature flag.
 */
export interface AnalyticsPageView {
  readonly path: string;
  readonly title?: string;
  readonly referrer?: string;
  readonly search?: string;
  readonly hash?: string;
  readonly [key: string]: unknown;
}

/**
 * The contract every analytics backend implements.
 *
 * All methods return `void` (or a resolved promise) — analytics is
 * fire-and-forget by design. Adapters that fail internally MUST log
 * to `console.error` rather than throwing so the fan-out in the
 * provider isn't stopped by one bad backend.
 */
export interface AnalyticsAdapter {
  /** Adapter display name — used by the provider's dev-mode logging. */
  readonly name: string;

  /**
   * Track a custom event. `name` is one of the app's declared events
   * (see `defineEvents`); `properties` is a free-form payload.
   */
  track(name: string, properties?: AnalyticsProperties): void;

  /** Associate the current session with a user + traits. */
  identify(identity: AnalyticsIdentity): void;

  /** Record a page-view. Called by the router integration on route change. */
  page(view: AnalyticsPageView): void;

  /**
   * Clear the current session — usually on logout. Adapters that
   * don't distinguish sessions can no-op.
   */
  reset?(): void;
}
