/**
 * @file meta-pixel.provider.ts
 * @module @stackra/analytics/core/providers
 * @description Meta (Facebook) marketing pixel provider.
 */

import type { IAnalyticsEvent, IAnalyticsPageView, IAnalyticsProvider } from "@stackra/contracts";

import type { IAnalyticsCspDirectives, IPixelProviderOptions } from "../interfaces";
import { CONSENT_CATEGORY_MARKETING } from "../constants";
import { injectScript } from "../utils/inject-script.util";

/** CSP directives the Meta pixel requires. */
export const META_PIXEL_CSP: IAnalyticsCspDirectives = {
  name: "analytics:meta-pixel",
  scriptSrc: ["https://connect.facebook.net"],
  imgSrc: ["https://www.facebook.com"],
  connectSrc: ["https://www.facebook.com"],
};

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };

/**
 * Meta pixel provider. Gated on the `marketing` consent category by default.
 */
export class MetaPixelProvider implements IAnalyticsProvider {
  public readonly name = "meta-pixel";

  public readonly consentCategory: string;

  public constructor(private readonly options: IPixelProviderOptions) {
    this.consentCategory = options.consentCategory ?? CONSENT_CATEGORY_MARKETING;
  }

  public init(): void {
    if (typeof window === "undefined") return;

    const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
    if (!w.fbq) {
      const fbq = ((...args: unknown[]) => {
        (fbq.queue = fbq.queue ?? []).push(args);
      }) as Fbq;
      fbq.queue = [];
      fbq.loaded = true;
      w.fbq = fbq;
      w._fbq = w._fbq ?? fbq;
      injectScript("https://connect.facebook.net/en_US/fbevents.js", "stackra-meta-pixel");
    }

    w.fbq("init", this.options.pixelId);
  }

  public track(event: IAnalyticsEvent): void {
    this.fbq("trackCustom", event.name, event.properties ?? {});
  }

  public page(_view: IAnalyticsPageView): void {
    this.fbq("track", "PageView");
  }

  private fbq(...args: unknown[]): void {
    if (typeof window === "undefined") return;
    (window as unknown as { fbq?: Fbq }).fbq?.(...args);
  }
}
