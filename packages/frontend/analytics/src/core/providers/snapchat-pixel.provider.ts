/**
 * @file snapchat-pixel.provider.ts
 * @module @stackra/analytics/core/providers
 * @description Snapchat marketing pixel provider.
 */

import type {
  IAnalyticsEvent,
  IAnalyticsIdentity,
  IAnalyticsPageView,
  IAnalyticsProvider,
} from '@stackra/contracts';

import type { IAnalyticsCspDirectives, IPixelProviderOptions } from '../interfaces';
import { CONSENT_CATEGORY_MARKETING } from '../constants';
import { injectScript } from '../utils/inject-script.util';

/** CSP directives the Snapchat pixel requires. */
export const SNAPCHAT_PIXEL_CSP: IAnalyticsCspDirectives = {
  name: 'analytics:snapchat-pixel',
  scriptSrc: ['https://sc-static.net'],
  imgSrc: ['https://tr.snapchat.com'],
  connectSrc: ['https://tr.snapchat.com'],
};

type Snaptr = ((...args: unknown[]) => void) & { queue?: unknown[] };

/**
 * Snapchat pixel provider. Gated on the `marketing` consent category by
 * default.
 */
export class SnapchatPixelProvider implements IAnalyticsProvider {
  public readonly name = 'snapchat-pixel';

  public readonly consentCategory: string;

  public constructor(private readonly options: IPixelProviderOptions) {
    this.consentCategory = options.consentCategory ?? CONSENT_CATEGORY_MARKETING;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    const w = window as unknown as { snaptr?: Snaptr };
    if (!w.snaptr) {
      const snaptr = ((...args: unknown[]) => {
        (snaptr.queue = snaptr.queue ?? []).push(args);
      }) as Snaptr;
      snaptr.queue = [];
      w.snaptr = snaptr;
      injectScript('https://sc-static.net/scevent.min.js', 'stackra-snapchat-pixel');
    }

    w.snaptr('init', this.options.pixelId);
  }

  public track(event: IAnalyticsEvent): void {
    this.snaptr('track', event.name, event.properties ?? {});
  }

  public page(_view: IAnalyticsPageView): void {
    this.snaptr('track', 'PAGE_VIEW');
  }

  public identify(identity: IAnalyticsIdentity): void {
    this.snaptr('init', this.options.pixelId, { user_id: identity.userId, ...identity.traits });
  }

  private snaptr(...args: unknown[]): void {
    if (typeof window === 'undefined') return;
    (window as unknown as { snaptr?: Snaptr }).snaptr?.(...args);
  }
}
