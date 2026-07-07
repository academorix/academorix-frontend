# `@/lib/telemetry` — dashboard real-user monitoring

Where the dashboard measures itself. The module owns the Core Web Vitals
observer (CLS, INP, LCP, TTFB, FCP) plus the type aliases every analytics
adapter reuses. Future RUM helpers (long-task observers, custom hydration
timers, cold-boot beacons) land here.

## Why we run our own observer instead of Vercel Speed Insights alone

Vercel Speed Insights and PostHog both ship built-in web-vitals collection. We
register our own on top of them for two reasons:

1. **Tenant slicing.** Speed Insights knows about routes and geographies but not
   about our tenants. When a metric regresses for one tenant we need to see it.
   Our reporter emits a `web_vital` event with the tenant-aware properties the
   analytics context injects, so downstream backends can slice by tenant /
   branch / role / release.
2. **Release attribution.** We tag every metric with `path` (and, once the
   analytics context is wired, with the `__ACADEMORIX_VERSION__` build tag) so a
   regression can be traced to the deploy that introduced it. Vercel ties
   metrics to deployments too, but only for its own project — a Vercel-hosted
   dashboard talking to a non-Vercel backend gets partial attribution.

The Vercel adapter can still be enabled alongside ours — the two are
complementary, not redundant.

## How the fan-out works

`reportWebVitals` takes a callback and hands it every metric fire. The callback
is a thin bridge into whichever sink the app has configured:

- **Local dev** — console log, so a developer sees the CLS spike after their
  change without opening a dashboard.
- **Production** — bridged into
  [`@academorix/analytics`](../../../../../packages/analytics)'
  `AnalyticsProvider` via `track("web_vital", report)`, which fans out to every
  registered adapter (Vercel, PostHog, Sentry).

`main.tsx` calls `reportWebVitals` exactly once, inside a `requestIdleCallback`
after the initial render. The observer registration is deferred so it doesn't
compete with hydration for the main-thread budget, and the `web-vitals` module
itself is dynamic-imported so it stays out of the critical-path chunk graph.

## Adding a new telemetry metric

Two flavours of "new metric":

1. **A new field on an existing report.** Extend
   [`web-vitals.type.ts`](./web-vitals.type.ts) → `WebVitalReport` and update
   the `toReport()` translator in [`web-vitals.util.ts`](./web-vitals.util.ts).
   Every consumer that types its payload against `WebVitalReport` picks it up
   automatically.
2. **A whole new metric family** (e.g. `long_task`, `route_transition`). Create
   a sibling `*.util.ts` and re-export it from the barrel
   ([`index.ts`](./index.ts)). Keep the shape consistent — every metric payload
   should carry at least `path` and a stable `id` so backends can dedup and
   slice.

Don't rename `WebVitalName` values without a coordinated backend event-schema
change — analytics events are versioned by the string in the `metric` field.
