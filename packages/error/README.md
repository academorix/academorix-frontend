# @stackra/error

Error-boundary system for the Stackra framework.

Catch render-time failures at the app, route, and component level; show sensible
default fallbacks built on `@stackra/ui`; and log everything at FATAL through
the `LOGGER_MANAGER` contract — without a hard dependency on `@stackra/logger`.

## Entry points

| Import                  | Contents                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `@stackra/error`        | Framework-agnostic helpers — `normalizeError`, `serializeError`, `SerializedError`. |
| `@stackra/error/react`  | Boundaries, presets, fallbacks, `useErrorBoundary`, `withErrorBoundary`.            |
| `@stackra/error/router` | `RouteErrorBoundary` — React Router `errorElement` integration.                     |

## Quick start

```tsx
import { AppErrorBoundary, ComponentErrorBoundary } from "@stackra/error/react";

function App() {
  return (
    <AppErrorBoundary>
      <Dashboard />
      <ComponentErrorBoundary label="Activity feed unavailable.">
        <ActivityFeed />
      </ComponentErrorBoundary>
    </AppErrorBoundary>
  );
}
```

### Escalate async failures

```tsx
import { useErrorBoundary } from "@stackra/error/react";

function SaveButton() {
  const { showBoundary } = useErrorBoundary();
  return (
    <button
      onClick={async () => {
        try {
          await save();
        } catch (err) {
          showBoundary(err);
        }
      }}
    >
      Save
    </button>
  );
}
```

### React Router

```tsx
import { RouteErrorBoundary } from "@stackra/error/router";

const routes = [
  { path: "/", element: <Home />, errorElement: <RouteErrorBoundary /> },
];
```

## Reporting (logging, analytics, telemetry)

The boundary owns no observability concern. Every boundary exposes an
`onError(error, info)` callback — wire it to whatever you use (a logger,
analytics, Sentry):

```tsx
<AppErrorBoundary
  onError={(error, info) => logger.fatal("render crash", error, info)}
>
  <App />
</AppErrorBoundary>
```

This keeps `@stackra/error` free of any logger/telemetry dependency; the
consumer decides where errors go.
