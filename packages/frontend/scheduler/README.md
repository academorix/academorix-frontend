# @stackra/scheduler

Client-side task scheduler for the Stackra framework — interval + cron
scheduling, decorator-based auto-discovery, lifecycle hooks, retry policy, and
React bindings.

## Install

```bash
pnpm add @stackra/scheduler @stackra/container @stackra/contracts @stackra/logger @vivtel/metadata reflect-metadata
```

## Quick start

```typescript
import { SchedulerModule } from "@stackra/scheduler";

@Module({
  imports: [SchedulerModule.forRoot({ logging: "info" })],
  providers: [SyncOrdersTask, HeartbeatTask],
})
export class AppModule {}
```

Auto-discovered tasks:

```typescript
import { Injectable } from "@stackra/container";
import { Scheduled } from "@stackra/scheduler";

@Scheduled({ name: "sync-orders", every: 60_000, retries: 2 })
@Injectable()
export class SyncOrdersTask {
  async run() {
    await this.orders.syncPending();
  }
}

@Scheduled({ name: "heartbeat", cron: "*/30 * * * * *" }) // every 30 seconds
@Injectable()
export class HeartbeatTask {
  async run() {
    await fetch("/api/heartbeat");
  }
}
```

At bootstrap, `ScheduledTaskLoader` scans every provider for `@Scheduled`
metadata and registers it with the runner.

## Public API

### `@Scheduled(options)`

| Option         | Type          | Purpose                                                                                     |
| -------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `name`         | `string`      | Unique task ID                                                                              |
| `every`        | `number` (ms) | Fixed-interval scheduling                                                                   |
| `cron`         | `string`      | Cron expression (5-field or 6-field with seconds)                                           |
| `immediate`    | `boolean`     | Run once at registration                                                                    |
| `retries`      | `number`      | Retry attempts on failure (default `0`)                                                     |
| `singleServer` | `boolean`     | Acquire a cross-tab lock via `@stackra/coordinator` before executing (only one tab runs it) |

The decorated class must implement `run(): Promise<void>`.

### `SchedulerService`

Programmatic registration (bypasses `@Scheduled`):

```typescript
import { Inject, Injectable } from "@stackra/container";
import { SCHEDULER_SERVICE } from "@stackra/contracts";
import { SchedulerService } from "@stackra/scheduler";

@Injectable()
class Setup {
  constructor(@Inject(SCHEDULER_SERVICE) private scheduler: SchedulerService) {}

  wire() {
    this.scheduler.register(
      "cleanup",
      async () => {
        await cache.gc();
      },
      {
        interval: 300_000,
        retries: 3,
        hooks: {
          onBefore: (name) => log.info(`starting ${name}`),
          onSuccess: (name, ms) => metrics.timing(`task.${name}`, ms),
          onFailure: (name, err) => log.error(`task ${name} failed`, err),
        },
      },
    );
  }
}
```

Runtime API:

```typescript
scheduler.register(name, fn, options);
scheduler.unregister(name);
await scheduler.runNow(name); // execute immediately, outside schedule
scheduler.pause(name); // pause without unregistering
scheduler.resume(name);
scheduler.getRegistered(); // IScheduledTask[]
```

### Cron expressions

Standard 5-field or 6-field cron:

```
# ┌──────── second (0-59, optional)
# │ ┌────── minute (0-59)
# │ │ ┌──── hour (0-23)
# │ │ │ ┌── day of month (1-31)
# │ │ │ │ ┌── month (1-12)
# │ │ │ │ │ ┌── day of week (0-6, Sunday=0)
# │ │ │ │ │ │
'0 3 * * *'         # every day at 3am
'*/5 * * * *'       # every 5 minutes
'0 0 * * MON'       # every Monday at midnight
'*/30 * * * * *'    # every 30 seconds (6-field)
```

### Custom task runners

Default runner uses `setInterval` + computed cron delays. Swap for a
platform-specific runner:

```typescript
import type { ITaskRunner } from "@stackra/scheduler";

class MyBackgroundRunner implements ITaskRunner {
  register(name, fn, options) {
    /* … */
  }
  unregister(name) {
    /* … */
  }
  async runNow(name) {
    /* … */
  }
  getRegistered() {
    /* … */
  }
  pause(name) {
    /* … */
  }
  resume(name) {
    /* … */
  }
}

SchedulerModule.forRoot({ runner: new MyBackgroundRunner() });
```

Reference implementations to write yourself: `ExpoTaskRunner` (React Native
background tasks), `SharedWorkerRunner` (offload to a shared worker).

## Events

```typescript
import { SCHEDULER_EVENTS } from "@stackra/contracts";

events.on(SCHEDULER_EVENTS.TASK_REGISTERED, ({ name, options }) => {});
events.on(SCHEDULER_EVENTS.TASK_UNREGISTERED, ({ name }) => {});
events.on(SCHEDULER_EVENTS.TASK_STARTED, ({ name }) => {});
events.on(SCHEDULER_EVENTS.TASK_COMPLETED, ({ name, timestamp }) => {});
events.on(SCHEDULER_EVENTS.TASK_FAILED, ({ name, error }) => {});
events.on(SCHEDULER_EVENTS.TASK_PAUSED, ({ name }) => {});
events.on(SCHEDULER_EVENTS.TASK_RESUMED, ({ name }) => {});
```

## React bindings — `@stackra/scheduler/react`

```tsx
import { useScheduler } from "@stackra/scheduler/react";

function TaskMonitor() {
  const { tasks, pause, resume, runNow, refresh } = useScheduler();

  return (
    <ul>
      {tasks.map((t) => (
        <li key={t.name}>
          {t.name} — {t.isRunning ? "running" : t.isPaused ? "paused" : "idle"}
          <button onClick={() => (t.isPaused ? resume(t.name) : pause(t.name))}>
            {t.isPaused ? "resume" : "pause"}
          </button>
          <button onClick={() => runNow(t.name)}>run now</button>
        </li>
      ))}
    </ul>
  );
}
```

## Testing — `@stackra/scheduler/testing`

```typescript
import { createMockScheduler } from "@stackra/scheduler/testing";

const scheduler = createMockScheduler();
service.setup(scheduler);

// Assert the task was registered
scheduler.$.assertCalled("register").once();

// Inspect the concrete state
const [task] = scheduler.getRegistered();
expect(task.name).toBe("cleanup");
expect(task.interval).toBe(300_000);

// Drive execution from a test — no real timers involved
await scheduler.runNow("cleanup");
```

The mock runner never starts real timers; you drive execution via
`.runNow(name)`. `.pause()` / `.resume()` state flips are reflected in
`.getRegistered()` so consumer code that observes those flags works against the
mock unchanged.

## Configuration

```bash
cp node_modules/@stackra/scheduler/config/scheduler.config.ts src/config/scheduler.config.ts
```

## Subpaths

| Import                       | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `@stackra/scheduler`         | Core `SchedulerModule`, `@Scheduled`, `SchedulerService`, `DefaultTaskRunner` |
| `@stackra/scheduler/react`   | `useScheduler`                                                                |
| `@stackra/scheduler/testing` | `createMockScheduler()`                                                       |

## License

MIT
