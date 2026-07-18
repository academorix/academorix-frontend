# @stackra/queue

Client-side job queue for the Stackra framework — pluggable connectors (memory,
sync, null, localStorage, IndexedDB, BroadcastChannel, QStash), workers,
decorator-based processors, retry policies, and React bindings.

## Install

```bash
pnpm add @stackra/queue @stackra/container @stackra/contracts @stackra/logger @stackra/support @vivtel/metadata reflect-metadata
```

## Quick start

```typescript
import { QueueModule } from "@stackra/queue";

@Module({
  imports: [
    QueueModule.forRoot({
      default: "memory",
      connections: {
        memory: { driver: "memory" },
        sync: { driver: "sync" },
      },
      worker: { tries: 3, backoffMs: 1000, autoStart: true },
    }),
  ],
  providers: [SendEmailProcessor, GenerateReportProcessor],
})
export class AppModule {}
```

## Public API

### Processors — `@Processor`

```typescript
import { Injectable } from "@stackra/container";
import { Processor, OnJobEvent } from "@stackra/queue";

@Processor({ name: "send-email", concurrency: 5 })
@Injectable()
export class SendEmailProcessor {
  async process(job: IQueuedJob<EmailPayload>) {
    await mailer.send(job.data);
  }

  @OnJobEvent("failed")
  onFailed(job: IQueuedJob, error: Error) {
    logger.error(`email failed for ${job.data.to}`, error);
  }
}
```

The `ProcessorSubscribersLoader` scans providers at bootstrap for `@Processor`
metadata and wires them up.

### Dispatching jobs

```typescript
import { Inject, Injectable } from "@stackra/container";
import { QUEUE_MANAGER } from "@stackra/contracts";
import { QueueManager } from "@stackra/queue";

@Injectable()
class OrderService {
  constructor(@Inject(QUEUE_MANAGER) private queue: QueueManager) {}

  async submit(order: Order) {
    await this.queue.dispatch("send-email", {
      to: order.email,
      template: "order-confirmation",
      data: order,
    });

    await this.queue.later("reminder", { orderId: order.id }, 3600); // 1h delay

    await this.queue.dispatch("sync-warehouse", order, {
      queue: "critical",
      tries: 5,
      backoffMs: 2000,
      unique: `sync-${order.id}`,
    });
  }
}
```

### Named queues

```typescript
const critical = queue.connection('critical');
await critical.push('urgent-job', payload);

const default = queue.connection();  // default connection
```

### Job options

| Option             | Type       | Purpose                              |
| ------------------ | ---------- | ------------------------------------ |
| `queue`            | `string`   | Connection name                      |
| `tries`            | `number`   | Max attempts                         |
| `backoffMs`        | `number`   | Delay between retries                |
| `delay`            | `number`   | Delay before first attempt (seconds) |
| `unique`           | `string`   | Deduplication key                    |
| `tags`             | `string[]` | For filtering / metrics              |
| `removeOnComplete` | `boolean`  | Clean up finished jobs               |
| `removeOnFail`     | `boolean`  | Clean up failed jobs                 |

## Connectors

| Driver              | Storage                        | Use case                                                                     |
| ------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `memory`            | In-process                     | Fastest. Lost on reload. Default for dev.                                    |
| `sync`              | Direct execution               | No async — runs inline. Good for tests.                                      |
| `null`              | None                           | Discards every job. Disable queue in envs where you don't want side effects. |
| `local-storage`     | `localStorage`                 | Persistent across reloads (~5 MB limit).                                     |
| `indexeddb`         | IndexedDB                      | Large capacity, async. Best for offline queues.                              |
| `broadcast-channel` | Coordinator + BroadcastChannel | Only one tab (the leader) drains the queue.                                  |
| `qstash`            | Upstash QStash HTTP API        | Serverless. Jobs delivered via webhook.                                      |
| `bullmq`            | Redis (optional adapter)       | Server / worker use only. Not shipped in core.                               |

Custom connector:

```typescript
import type {
  IQueueConnector,
  IQueueConnection,
  IQueueConnectionConfig,
} from "@stackra/queue";

class MyDriver implements IQueueConnector {
  async connect(config: IQueueConnectionConfig): Promise<IQueueConnection> {
    /* ... */
  }
}

QueueModule.forFeature("my-driver", MyDriver);
```

## Worker

Each connection has a worker that pulls jobs and hands them to processors:

```typescript
const worker = queue.connection("critical").worker();
worker.start();
worker.pause();
worker.resume();
await worker.stop();
```

Configuration is set globally via `forRoot({ worker: {...} })` or
per-connection.

## Events

```typescript
import { QUEUE_EVENTS } from "@stackra/contracts";

events.on(QUEUE_EVENTS.JOB_QUEUED, ({ jobId, queue, name }) => {});
events.on(QUEUE_EVENTS.JOB_DISPATCHED, ({ jobId, queue, name }) => {});
events.on(QUEUE_EVENTS.JOB_STARTED, ({ jobId, queue, name }) => {});
events.on(
  QUEUE_EVENTS.JOB_COMPLETED,
  ({ jobId, queue, name, durationMs }) => {},
);
events.on(QUEUE_EVENTS.JOB_RETRY, ({ jobId, error, attempt }) => {});
events.on(
  QUEUE_EVENTS.JOB_FAILED,
  ({ jobId, queue, name, error, attempt }) => {},
);
events.on(QUEUE_EVENTS.JOB_DEAD, ({ jobId, queue, name }) => {});
events.on(QUEUE_EVENTS.WORKER_STARTED, ({ queue }) => {});
events.on(QUEUE_EVENTS.WORKER_STOPPED, ({ queue }) => {});
```

## React bindings — `@stackra/queue/react`

```tsx
import { useQueue } from "@stackra/queue/react";

function DispatchButton() {
  const queue = useQueue();
  return (
    <button onClick={() => queue.dispatch("send-newsletter", {})}>send</button>
  );
}
```

## Testing — `@stackra/queue/testing`

```typescript
import { createMockQueue } from "@stackra/queue/testing";

const queue = createMockQueue();
await orders.submit(order); // internally: queue.dispatch('send-email', { to: order.email })

// Fluent assertion on the manager itself
queue.$.assertCalled("dispatch").with("send-email", { to: order.email }).once();

// Or reach into the underlying connection ledger for structural assertions
const conn = await queue.connection();
expect(conn.dispatchedJobs).toHaveLength(1);
expect(conn.dispatchedJobs[0]).toMatchObject({ name: "send-email" });
```

The mock connection fully implements `IQueueConnection` — jobs pushed via
`.push()` / `.later()` / `.bulk()` are retrievable with `.pop()`, respect
`.pause()` / `.resume()`, and honor delay via `scheduledFor`.

## Configuration

```bash
cp node_modules/@stackra/queue/config/queue.config.ts src/config/queue.config.ts
```

## Subpaths

| Import                   | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `@stackra/queue`         | Core `QueueModule`, `@Processor`, `QueueManager`, connectors |
| `@stackra/queue/react`   | `useQueue`                                                   |
| `@stackra/queue/testing` | `createMockQueue()`                                          |

## License

MIT
