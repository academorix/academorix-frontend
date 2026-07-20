# @stackra/sync

Offline-first synchronization engine for the Stackra framework — cursor-based
pull, batched push with idempotency keys, pluggable conflict resolution,
cross-tab coordination, and persistent operation queue.

## Install

```bash
pnpm add @stackra/sync @stackra/container @stackra/contracts @stackra/http @stackra/network reflect-metadata
```

## Subpaths

| Import                  | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `@stackra/sync`         | `SyncModule`, `SyncEngine`, services, resolvers, strategies |
| `@stackra/sync/react`   | `useSyncStatus`, `useConflictResolver`                      |
| `@stackra/sync/native`  | `AsyncStorageQueueAdapter` for React Native persistence     |
| `@stackra/sync/testing` | Mock client, mock adapters, assertable proxies              |

## Quick start

```ts
import { Module } from "@stackra/container";
import { HttpModule } from "@stackra/http";
import { NetworkModule } from "@stackra/network";
import { CoordinatorModule } from "@stackra/coordinator";
import { SyncModule } from "@stackra/sync";
import { ConflictStrategy } from "@stackra/contracts";

@Module({
  imports: [
    HttpModule.forRoot({/* ... */}),
    NetworkModule.forRoot({/* ... */}),
    CoordinatorModule.forRoot({/* ... */}),
    SyncModule.forRoot({
      baseUrl: "https://api.example.com",
      defaultStrategy: ConflictStrategy.LastWriteWins,
      autoSyncInterval: 60_000,
      autoSyncOnReconnect: true,
      batchSize: 50,
    }),
  ],
})
export class AppModule {}
```

Every runtime primitive lives in a separate package:

- `@stackra/http` — transport
- `@stackra/network` — online/offline detector
- `@stackra/coordinator` — leader-election so only one tab drains the queue
- `@stackra/pipeline` — the observable pull/push/full-sync pipelines
- `@stackra/support` — `BaseRegistry`, `createSeedLoader`, `Str`

Every token, interface, enum, and event map is imported directly from
`@stackra/contracts` — this package re-exports none of them.

## License

MIT © Stackra L.L.C
