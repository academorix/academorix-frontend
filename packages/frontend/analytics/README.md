# @stackra/analytics

Analytics & tracking for the Stackra framework — a **consent-gated**, fan-out
manager over pluggable destinations (GA4, console) and marketing pixels (Meta,
TikTok, Snapchat), with auto-registration and React bindings.

## Register

```ts
import { AnalyticsModule } from "@stackra/analytics";

@Module({
  imports: [
    // ConsentModule.forRoot(...) should be present so gating works.
    AnalyticsModule.forRoot({
      default: "console",
      providers: {
        console: { driver: "console" },
        ga4: { driver: "ga4", measurementId: "G-XXXXXXX" }, // gated on `analytics`
        "meta-pixel": { driver: "meta-pixel", pixelId: "123" }, // gated on `marketing`
      },
    }),
  ],
})
export class AppModule {}
```

## Consent gating

Each provider declares a `consentCategory`. The manager only dispatches to a
provider once consent for its category is granted (resolved from
`@stackra/consent` via `Symbol.for('CONSENT_MANAGER')` — no hard dependency).
Events emitted before consent are **buffered** and replayed per-provider as
categories are granted. With no consent manager wired the manager fails
**closed** (drops gated events) unless `requireConsent: false`.

Built-in category defaults: GA4 → `analytics`; Meta/TikTok/Snapchat →
`marketing`; console → ungated.

## Custom / extra marketing providers

```ts
@AnalyticsProvider({ name: "amplitude" })
@Injectable()
export class AmplitudeProvider implements IAnalyticsProvider {
  /* ... */
}

// or explicitly:
AnalyticsModule.forFeature(AmplitudeProvider);
```

## CSP

Script-injecting providers (GA4 + pixels) need their origins allow-listed or the
browser blocks them. Derive the contributions from the same config so the CSP
can't drift from the enabled providers:

```ts
import { AnalyticsModule, getAnalyticsCspPolicies } from "@stackra/analytics";

imports: [
  CspModule.forRoot(cspConfig),
  ...getAnalyticsCspPolicies(analyticsConfig).map((p) =>
    CspModule.forFeature(p),
  ),
  AnalyticsModule.forRoot(analyticsConfig),
];
```

The per-provider constants (`GA4_CSP`, `META_PIXEL_CSP`, `TIKTOK_PIXEL_CSP`,
`SNAPCHAT_PIXEL_CSP`) are also exported if you prefer to wire them manually.

## React

```tsx
const analytics = useAnalytics();
analytics.track("cta_clicked", { id: "hero" });

// auto page views:
usePageView(useLocation().pathname);
```

Inject anywhere via `ANALYTICS_MANAGER` (from `@stackra/contracts`).
