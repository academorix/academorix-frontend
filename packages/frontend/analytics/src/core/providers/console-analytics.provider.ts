/**
 * @file console-analytics.provider.ts
 * @module @stackra/analytics/core/providers
 * @description Zero-dependency provider that logs events to the console.
 */

import type {
  IAnalyticsEvent,
  IAnalyticsIdentity,
  IAnalyticsPageView,
  IAnalyticsProvider,
} from "@stackra/contracts";

/**
 * Console analytics provider — prints events. Consent-exempt (no category)
 * so it always fires, making it a safe development default.
 */
export class ConsoleAnalyticsProvider implements IAnalyticsProvider {
  public readonly name = "console";

  public track(event: IAnalyticsEvent): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics] track", event.name, event.properties ?? {});
  }

  public page(view: IAnalyticsPageView): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics] page", view.path, view.properties ?? {});
  }

  public identify(identity: IAnalyticsIdentity): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics] identify", identity.userId, identity.traits ?? {});
  }

  public reset(): void {
    // eslint-disable-next-line no-console
    console.debug("[analytics] reset");
  }
}
