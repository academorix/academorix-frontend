# @academorix/analytics

Analytics primitives for the Academorix workspace: adapter interface,
`AnalyticsProvider` + `useAnalytics` factory, `defineEvents` passthrough, and
pluggable console / Vercel / PostHog / Sentry adapters.

Depends on `@academorix/core` and React 19.

## Public API

| Subpath                                  | Exports                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@academorix/analytics/config`           | `defineEvents<T extends Record<string, string>>(events)`                                  |
| `@academorix/analytics/context`          | `createAnalyticsContext<TEvent>()` → `{ AnalyticsProvider, useAnalytics }`                |
| `@academorix/analytics/adapters`         | `AnalyticsAdapter`, `AnalyticsIdentity`, `AnalyticsPageView`, `AnalyticsProperties` types |
| `@academorix/analytics/adapters/console` | `consoleAnalyticsAdapter`, `createConsoleAnalyticsAdapter(prefix?)`                       |
| `@academorix/analytics/adapters/vercel`  | `vercelAnalyticsAdapter` (requires `@vercel/analytics` in the app)                        |
| `@academorix/analytics/adapters/posthog` | `posthogAnalyticsAdapter` (requires `posthog-js` in the app)                              |
| `@academorix/analytics/adapters/sentry`  | `sentryAnalyticsAdapter`, `createSentryAnalyticsAdapter({ modulePath })`                  |

Root barrel re-exports everything.

## Design principles

- **Fan-out over hard integration.** The provider composes zero or more adapters
  and forwards every call. Adding a vendor is one adapter file + one config
  line.
- **Event registry stays app-owned.** Each app declares its own
  `defineEvents({ ... })`. Two dashboards will never share the same event list.
- **SDK loading is lazy.** Every non-trivial adapter dynamic-imports its SDK at
  first call. Apps that don't ship a given SDK pay zero bytes for the adapter's
  presence.
- **SSR-safe.** All adapters no-op when `window` is undefined.
- **Fail soft.** A broken adapter never breaks the fan-out — errors are caught
  and logged.

## Usage

### 1. Declare the app's events

```ts
// apps/dashboard/src/config/analytics.config.ts
import { defineEvents } from "@academorix/analytics/config";

export const EVENTS = defineEvents({
  userLoggedIn: "user_logged_in",
  athleteCreated: "athlete_created",
  athleteEdited: "athlete_edited",
  commandOpened: "command_palette_opened",
});

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
```

### 2. Instantiate the provider bundle

```ts
// apps/dashboard/src/lib/analytics/context.ts
import { createAnalyticsContext } from "@academorix/analytics/context";
import { type AnalyticsEvent } from "@/config/analytics.config";

export const { AnalyticsProvider, useAnalytics } =
  createAnalyticsContext<AnalyticsEvent>();
```

### 3. Mount with adapters

```tsx
// apps/dashboard/src/providers.tsx
import { vercelAnalyticsAdapter } from "@academorix/analytics/adapters/vercel";
import { posthogAnalyticsAdapter } from "@academorix/analytics/adapters/posthog";
import { sentryAnalyticsAdapter } from "@academorix/analytics/adapters/sentry";

<AnalyticsProvider
  adapters={[
    vercelAnalyticsAdapter,
    posthogAnalyticsAdapter,
    sentryAnalyticsAdapter,
  ]}
>
  <App />
</AnalyticsProvider>;
```

### 4. Consume anywhere

```tsx
import { useAnalytics } from "@/lib/analytics";
import { EVENTS } from "@/config/analytics.config";

function CreateAthleteButton() {
  const { track } = useAnalytics();

  return (
    <Button onPress={() => track(EVENTS.athleteCreated, { tenantId })}>
      Create
    </Button>
  );
}
```

## Adapter installation cheat-sheet

Each adapter dynamic-imports its SDK. Install the peer package in the consuming
app when you enable the adapter:

```bash
# Vercel Analytics
pnpm --filter @academorix/dashboard add @vercel/analytics

# PostHog
pnpm --filter @academorix/dashboard add posthog-js

# Sentry (Vite/React)
pnpm --filter @academorix/dashboard add @sentry/react

# Sentry (Next.js)
pnpm --filter @academorix/landing-page add @sentry/nextjs
```
