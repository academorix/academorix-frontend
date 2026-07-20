/**
 * @file analytics-provider.interface.ts
 * @module @stackra/contracts/interfaces/analytics
 * @description Contract implemented by every analytics destination —
 *   product analytics (GA4, Segment, PostHog) and marketing pixels
 *   (Meta, TikTok, Snapchat). The manager fans events out to all of them.
 */

/** A tracked behavioural event. */
export interface IAnalyticsEvent {
  /** Event name (e.g. `signup_completed`). */
  name: string;
  /** Arbitrary event properties. */
  properties?: Record<string, unknown>;
}

/** A page/screen view. */
export interface IAnalyticsPageView {
  /** Path or screen name. */
  path: string;
  /** Document title. */
  title?: string;
  /** Referrer URL. */
  referrer?: string;
  /** Extra view properties. */
  properties?: Record<string, unknown>;
}

/** A user identification call. */
export interface IAnalyticsIdentity {
  /** Stable user id. */
  userId: string;
  /** Additional user traits. */
  traits?: Record<string, unknown>;
}

/**
 * A single analytics destination.
 *
 * `consentCategory` ties the provider to a `@stackra/consent` category
 * slug: the manager will not dispatch to this provider until consent for
 * that category is granted. Leave it undefined for consent-exempt
 * (strictly-necessary) destinations.
 */
export interface IAnalyticsProvider {
  /** Unique provider name (e.g. `ga4`, `meta-pixel`). */
  readonly name: string;

  /**
   * Consent category slug required before this provider fires. When set,
   * the manager gates all dispatch on `hasConsent(consentCategory)`.
   */
  readonly consentCategory?: string;

  /** One-time async initialisation (SDK / pixel script boot). */
  init?(): void | Promise<void>;

  /** Record a behavioural event. */
  track(event: IAnalyticsEvent): void;

  /** Record a page/screen view. */
  page?(view: IAnalyticsPageView): void;

  /** Associate subsequent events with a user. */
  identify?(identity: IAnalyticsIdentity): void;

  /** Clear the current identity (e.g. on logout). */
  reset?(): void;
}
