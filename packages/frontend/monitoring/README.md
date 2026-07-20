# @stackra/monitoring

Error monitoring for the Stackra framework — a fan-out manager over pluggable
providers (Sentry, console, or your own), with auto-registration and React
bindings.

## Install & register

```ts
import { MonitoringModule } from "@stackra/monitoring";

@Module({
  imports: [
    MonitoringModule.forRoot({
      environment: "production",
      default: "sentry",
      providers: {
        console: { driver: "console" },
        sentry: { driver: "sentry", dsn: process.env.SENTRY_DSN },
      },
      // stack: ['sentry'],  // optional — restrict fan-out to a subset
    }),
  ],
})
export class AppModule {}
```

Built on `MultipleInstanceManager` (like cache/queue): `providers` declares
named instances (each selecting a `driver`), and every `captureException` /
`captureMessage` / `addBreadcrumb` / `setUser` fans out to the `stack` (default:
all configured instances). `provider(name)` gives named access. Providers init
eagerly in `onApplicationBootstrap`. A throwing provider is isolated.

## Custom providers

Two ways, both auto-registered:

```ts
// 1. Decorator — discovered at bootstrap.
@MonitoringProvider({ name: "datadog" })
@Injectable()
export class DatadogProvider implements IMonitoringProvider {
  /* ... */
}

// 2. forFeature — registers a class explicitly.
MonitoringModule.forFeature(DatadogProvider);
```

## Error-boundary integration

`@stackra/monitoring` pairs with `@stackra/error` through the boundary's
`onError` hook — no dependency between the two packages:

```tsx
const monitoring = useMonitoring();
<AppErrorBoundary
  onError={(error, info) =>
    monitoring.captureException(error, { componentStack: info.componentStack })
  }
>
  <App />
</AppErrorBoundary>;
```

Inject anywhere via `MONITORING_MANAGER` (from `@stackra/contracts`).
