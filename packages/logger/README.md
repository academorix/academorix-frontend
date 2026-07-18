# @stackra/logger

Client-side structured logger for the Stackra framework — Laravel-style
channels, pluggable reporters, an enrichment pipeline (redaction, interpolation,
context, sampling), and React bindings.

## Install

```bash
pnpm add @stackra/logger @stackra/container @stackra/contracts reflect-metadata
```

## Quick start

```typescript
import { Module } from "@stackra/container";
import { LoggerModule } from "@stackra/logger";
import { LogLevel } from "@stackra/contracts";

@Module({
  imports: [
    LoggerModule.forRoot({
      default: "app",
      channels: {
        app: {
          driver: "single",
          reporters: ["console"],
          level: LogLevel.DEBUG,
        },
        audit: { driver: "single", reporters: ["json"], level: LogLevel.INFO },
      },
      redact: { paths: ["password", "token", "creditCard.*"] },
    }),
  ],
})
export class AppModule {}
```

Then anywhere:

```typescript
import { Injectable } from "@stackra/container";
import { Logger } from "@stackra/logger";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  create(input: UserInput) {
    this.logger.info("creating user", { email: input.email });
    // …
  }
}
```

## Public API

### `Logger`

Scoped logger created with a class or module name:

```typescript
const logger = new Logger('MyContext');

logger.debug('...', context?);
logger.info('...', context?);
logger.notice('...', context?);
logger.warn('...', context?);
logger.error('...', context?);
logger.critical('...', context?);
logger.alert('...', context?);
logger.emergency('...', context?);

logger.log(LogLevel.INFO, '...', context?);

// Named channel selection
logger.channel('audit').info('user deleted', { userId });

// Enriched sub-logger
const scoped = logger.withContext({ userId: 5 });
scoped.info('...'); // includes userId automatically
```

### Channels

A channel is a named log destination composed of one or more reporters:

```typescript
LoggerModule.forRoot({
  default: "app",
  channels: {
    app: { driver: "single", reporters: ["console"] },
    audit: { driver: "single", reporters: ["json"] },
    errors: { driver: "stack", channels: ["console", "audit"] },
  },
});
```

Drivers: `single` (one reporter list), `stack` (fan out to other named
channels), `daily`/`rotating` (via plugin).

### Reporters

Built-in reporters — auto-discovered via `@Reporter()`:

| Name      | Purpose                                  |
| --------- | ---------------------------------------- |
| `console` | Pretty-printed console output with color |
| `json`    | One JSON line per log record             |
| `silent`  | Discards everything — useful for tests   |

Custom reporter:

```typescript
import { Injectable } from "@stackra/container";
import { Reporter, type IReporter, type ILogRecord } from "@stackra/logger";

@Reporter({ name: "sentry" })
@Injectable()
class SentryReporter implements IReporter {
  report(record: ILogRecord): void {
    if (record.level >= LogLevel.ERROR)
      Sentry.captureMessage(record.message, { extra: record.context });
  }
}
```

Register it as a provider anywhere in your DI graph — the `ReporterLoader` scans
providers at bootstrap and registers everything with `@Reporter` metadata.

### Enrichment pipeline

Each log record passes through enrichers in order before reaching reporters:

1. **`InterpolationEnricher`** — resolves `{placeholder}` substitutions.
2. **`ContextEnricher`** — folds `ContextRepository` state (per-request or
   per-user) into every record.
3. **`RedactionEnricher`** — deep-scrubs any path listed in
   `config.redact.paths` (supports `foo.*` wildcards).

Extend the pipeline by writing a class that implements `IEnricher` from
`@stackra/contracts` and declaring it as a DI provider.

### Environment overrides

`mergeConfig` layers env vars on top of user options:

| Variable              | Effect                                          |
| --------------------- | ----------------------------------------------- |
| `LOG_LEVEL=debug`     | Forces every channel to the given minimum level |
| `APP_DEBUG=true`      | Same as `LOG_LEVEL=debug`                       |
| `NODE_ENV=production` | Silences debug-only channels                    |

### React bindings — `@stackra/logger/react`

```tsx
import { useLogger } from "@stackra/logger/react";

function Panel() {
  const logger = useLogger("Panel");
  logger.info("rendered");
  return <div />;
}
```

Also ships `<LogLevelSwitcher />`, `<LogChannelInspector />`, and
`<LogEventStream />` for in-app debug UI.

### Testing helper — `@stackra/logger/testing`

```typescript
import {
  createMockLogger,
  createMockLoggerManager,
} from "@stackra/logger/testing";

// Standalone logger — for tests that inject a single ILogger
const logger = createMockLogger();
service.doThing(logger);
logger.$.assertCalled("info").with("did the thing").once();

// Full manager — for tests that resolve LOGGER_MANAGER and call .create()
const manager = createMockLoggerManager();
service.setup(manager);
const scoped = manager.getLogger("UserService");
expect(scoped?.getLogsByLevel("error")).toHaveLength(1);
```

Both mocks fully implement their contracts (`ILogger` — all 11 methods,
`ILoggerManager` — `create()` and `channel()`). Logs are appended to `.logs` in
the order they occurred with level, message, and context intact.

## Configuration

Copy the template:

```bash
mkdir -p src/config
cp node_modules/@stackra/logger/config/logger.config.ts src/config/logger.config.ts
```

Then in `app.module.ts`:

```typescript
import { loggerConfig } from "@/config/logger.config";
LoggerModule.forRoot(loggerConfig);
```

## Subpaths

| Import                    | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `@stackra/logger`         | Core `Logger`, `LoggerModule`, `Reporter` decorator |
| `@stackra/logger/react`   | React hooks + debug components                      |
| `@stackra/logger/testing` | `createMockLogger()`                                |

## License

MIT
