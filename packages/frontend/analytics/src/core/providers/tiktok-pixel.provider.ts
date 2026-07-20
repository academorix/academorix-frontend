/**
 * @file tiktok-pixel.provider.ts
 * @module @stackra/analytics/core/providers
 * @description TikTok marketing pixel provider.
 */

import type {
  IAnalyticsEvent,
  IAnalyticsIdentity,
  IAnalyticsPageView,
  IAnalyticsProvider,
} from '@stackra/contracts';

import type { IAnalyticsCspDirectives, IPixelProviderOptions } from '../interfaces';
import { CONSENT_CATEGORY_MARKETING } from '../constants';

/** CSP directives the TikTok pixel requires. */
export const TIKTOK_PIXEL_CSP: IAnalyticsCspDirectives = {
  name: 'analytics:tiktok-pixel',
  scriptSrc: ['https://analytics.tiktok.com'],
  imgSrc: ['https://analytics.tiktok.com'],
  connectSrc: ['https://analytics.tiktok.com'],
};

interface Ttq {
  (...args: unknown[]): void;
  load?: (id: string) => void;
  page?: () => void;
  track?: (event: string, props?: Record<string, unknown>) => void;
  identify?: (traits: Record<string, unknown>) => void;
  methods?: string[];
}

/**
 * TikTok pixel provider. Gated on the `marketing` consent category by
 * default.
 */
export class TiktokPixelProvider implements IAnalyticsProvider {
  public readonly name = 'tiktok-pixel';

  public readonly consentCategory: string;

  public constructor(private readonly options: IPixelProviderOptions) {
    this.consentCategory = options.consentCategory ?? CONSENT_CATEGORY_MARKETING;
  }

  public init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const w = window as unknown as { ttq?: Ttq; TiktokAnalyticsObject?: string };
    if (w.ttq) {
      w.ttq.load?.(this.options.pixelId);
      return;
    }

    w.TiktokAnalyticsObject = 'ttq';
    const queue: unknown[] = [];
    const ttq = ((...args: unknown[]) => {
      queue.push(args);
    }) as Ttq;
    w.ttq = ttq;

    if (!document.getElementById('stackra-tiktok-pixel')) {
      const script = document.createElement('script');
      script.id = 'stackra-tiktok-pixel';
      script.async = true;
      script.src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      document.head.appendChild(script);
    }

    ttq.load?.(this.options.pixelId);
  }

  public track(event: IAnalyticsEvent): void {
    this.ttq()?.track?.(event.name, event.properties ?? {});
  }

  public page(_view: IAnalyticsPageView): void {
    this.ttq()?.page?.();
  }

  public identify(identity: IAnalyticsIdentity): void {
    this.ttq()?.identify?.({ external_id: identity.userId, ...identity.traits });
  }

  private ttq(): Ttq | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as unknown as { ttq?: Ttq }).ttq;
  }
}
