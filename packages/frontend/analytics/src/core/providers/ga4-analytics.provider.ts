/**
 * @file ga4-analytics.provider.ts
 * @module @stackra/analytics/core/providers
 * @description Google Analytics 4 provider (gtag.js).
 */

import type {
  IAnalyticsEvent,
  IAnalyticsIdentity,
  IAnalyticsPageView,
  IAnalyticsProvider,
} from '@stackra/contracts';

import type { IAnalyticsCspDirectives, IGa4ProviderOptions } from '../interfaces';
import { CONSENT_CATEGORY_ANALYTICS } from '../constants';
import { injectScript } from '../utils/inject-script.util';

/** CSP directives GA4 requires. */
export const GA4_CSP: IAnalyticsCspDirectives = {
  name: 'analytics:ga4',
  scriptSrc: ['https://www.googletagmanager.com'],
  imgSrc: ['https://www.google-analytics.com', 'https://www.googletagmanager.com'],
  connectSrc: ['https://www.google-analytics.com', 'https://www.googletagmanager.com'],
};

type Gtag = (...args: unknown[]) => void;

/**
 * GA4 analytics provider. Gated on the `analytics` consent category by
 * default.
 */
export class Ga4AnalyticsProvider implements IAnalyticsProvider {
  public readonly name = 'ga4';

  public readonly consentCategory: string;

  public constructor(private readonly options: IGa4ProviderOptions) {
    this.consentCategory = options.consentCategory ?? CONSENT_CATEGORY_ANALYTICS;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    const w = window as unknown as { dataLayer?: unknown[]; gtag?: Gtag };
    w.dataLayer = w.dataLayer ?? [];
    const gtag: Gtag = (...args: unknown[]) => {
      w.dataLayer!.push(args);
    };
    w.gtag = w.gtag ?? gtag;

    injectScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.options.measurementId)}`,
      'stackra-ga4'
    );

    w.gtag('js', new Date());
    w.gtag('config', this.options.measurementId, { send_page_view: false });
  }

  public track(event: IAnalyticsEvent): void {
    this.gtag('event', event.name, event.properties ?? {});
  }

  public page(view: IAnalyticsPageView): void {
    this.gtag('event', 'page_view', {
      page_path: view.path,
      page_title: view.title,
      page_referrer: view.referrer,
      ...view.properties,
    });
  }

  public identify(identity: IAnalyticsIdentity): void {
    this.gtag('set', { user_id: identity.userId, user_properties: identity.traits });
  }

  private gtag(...args: unknown[]): void {
    if (typeof window === 'undefined') return;
    (window as unknown as { gtag?: Gtag }).gtag?.(...args);
  }
}
