# Manager base-class review — 2026-07-22

**Scope.** Every `@stackra/*Manager` class in `packages/frontend/**` audited
against `.kiro/steering/package-conventions.md` §"Manager base — pick the right
one":

- `Manager<T>` — one active driver, switchable (logger channels, auth).
  `driver(name)`.
- `MultipleInstanceManager<T>` — N independently-configured named instances
  (cache, queue, http, monitoring, analytics). `instance(name)`,
  `create{Driver}Driver(config)` convention, `extend(driver, creator)`.

**Result.** 17 Manager classes surveyed. Six extend a base class. Two are
mismatched vs the steering guidance (queue + cache); the remaining non-extenders
are specialised services, not driver managers, and correctly skip the base.

## Manager classes surveyed

| Package         | Class                       | Base                                           | Verdict                    |
| --------------- | --------------------------- | ---------------------------------------------- | -------------------------- |
| `logger`        | `LoggerManager`             | `Manager<ILogChannel>`                         | ✅ correct                 |
| `cache`         | `CacheManager`              | `Manager<ICacheStore>`                         | ⚠️ should be MI            |
| `queue`         | `QueueManager`              | `Manager<IQueueConnection>`                    | ⚠️ should be MI            |
| `realtime`      | `RealtimeManager`           | `Manager<IRealtimeConnection>`                 | ✅ correct (single socket) |
| `storage`       | `StorageManager`            | `MultipleInstanceManager<IStorage>`            | ✅ correct                 |
| `http`          | `HttpManager`               | `MultipleInstanceManager<IHttpClient>`         | ✅ correct                 |
| `monitoring`    | `MonitoringManager`         | `MultipleInstanceManager<IMonitoringProvider>` | ✅ correct                 |
| `analytics`     | `AnalyticsManager`          | `MultipleInstanceManager<IAnalyticsProvider>`  | ✅ correct                 |
| `settings`      | `SettingsStoreManager`      | none                                           | ✅ specialised service     |
| `collaboration` | `RoomManager`               | none                                           | ✅ specialised service     |
| `coordinator`   | `LockManager`               | none                                           | ✅ specialised service     |
| `coordinator`   | `TabTransportManager`       | none                                           | ✅ specialised service     |
| `consent`       | `ConsentManager`            | none                                           | ✅ specialised service     |
| `ai`            | `ConnectionManager`         | none                                           | ✅ specialised service     |
| `i18n`          | `I18nManager`               | none                                           | ✅ specialised service     |
| `notifications` | `PushSubscriptionManager`   | none                                           | ✅ specialised service     |
| `notifications` | `NotificationManager`       | none                                           | ✅ specialised service     |
| `notifications` | `NativeNotificationManager` | none                                           | ✅ specialised service     |

## Findings

### F1. `CacheManager` extends `Manager<ICacheStore>` — should be `MultipleInstanceManager`

**Package:** `@stackra/cache` **File:**
`packages/frontend/cache/src/core/services/cache-manager.service.ts:41`
**Base:** `Manager<ICacheStore>` (single active driver, switchable) **Steering
says:** `MultipleInstanceManager` (per §"Manager base" — cache is explicitly
named)

**Evidence.** The config surface is
`{ default: string, stores: Record<string, ICacheStoreConfig> }` — every named
store carries its OWN config (`memory` has `maxSize`, `redis` has `host` /
`port` / `password`, etc.). That's the exact shape `MultipleInstanceManager`
models: N independently-configured named instances resolved by name.
`Manager<T>`'s one-shared-config model doesn't fit.

The current `Manager` base still works because `CacheManager.createXxxDriver`
methods can read `this.config.stores[name]` internally, but the alias
`store(name)` wrapping `driver(name)` is a symptom — the true API here is
`instance(name)` from `MultipleInstanceManager`.

**Impact if left.** No runtime failure — the difference is idiomatic vs.
non-idiomatic. Future maintainers reading the doc + the code will find a
mismatch. Migration is mechanical: swap the base + rename `createXxxDriver`
methods to keep the config injection intact.

**Recommendation.** Migrate to `MultipleInstanceManager<ICacheStore>` in a
dedicated PR alongside `@stackra/cache`'s next changeset. Non-breaking to public
API (keep the `store(name)` alias).

### F2. `QueueManager` extends `Manager<IQueueConnection>` — should be `MultipleInstanceManager`

**Package:** `@stackra/queue` **File:**
`packages/frontend/queue/src/core/services/queue-manager.service.ts:32`
**Base:** `Manager<IQueueConnection>` **Steering says:**
`MultipleInstanceManager` (per §"Manager base" — queue is explicitly named)

**Evidence.** Same shape as cache —
`{ default, connections: Record<string, IQueueConnectionConfig> }`. The
`connection(name?)` method is the queue's `instance(name?)` equivalent.
Per-connection config again.

**Recommendation.** Same as F1 — migrate to
`MultipleInstanceManager<IQueueConnection>` alongside the next `@stackra/queue`
changeset. The public API of `connection(name?)`, `dispatch(...)`,
`disconnect(...)` stays intact.

### F3. Naming consistency — `createXxxDriver` vs. `store(name)` vs. `instance(name)`

`Manager<T>` exposes `driver(name)`; `MultipleInstanceManager<T>` exposes
`instance(name)`. Feature packages layer domain-specific aliases:

- `cache.store(name)`
- `queue.connection(name?)`
- `http.client(name?)` (via `MultipleInstanceManager.instance` under the hood)
- `logger.channel(name?)` (via `Manager.driver` under the hood)

This pattern is fine — the aliases keep the surface readable per domain. Just
document them consistently in each package's README (already true for cache and
http; queue's README should mention that `connection` is a
`MultipleInstanceManager.instance` alias post-F2).

## Non-driver managers — correctly not extending a base

The nine specialised services (`SettingsStoreManager`, `RoomManager`,
`LockManager`, `TabTransportManager`, `ConsentManager`, `ConnectionManager`,
`I18nManager`, `PushSubscriptionManager`, `NotificationManager`,
`NativeNotificationManager`) all correctly skip both base classes. They don't
manage swappable drivers — they own domain state (rooms, locks, transports,
consent state, connection state, i18n state, subscription state, notification
history). The `Manager` suffix here means "orchestrator of domain state", not
"resolver of named drivers". No change needed.

## Recommendations

1. **Land F1 + F2 as small, focused PRs.** Each is ~200 lines of change inside
   one file — the migration replaces `extends Manager<T>` with
   `extends MultipleInstanceManager<T>` and renames the `createXxxDriver`
   protected methods to match the base's discovery convention. Public API stays
   intact via the domain aliases (`store(name)`, `connection(name)`).
2. **Update `@stackra/queue`'s README** post-F2 to note the base-class alignment
   (as `@stackra/cache`'s README does).
3. **No action on the non-driver managers** — they are correctly specialised.
4. **Do not** retroactively rewrite `LoggerManager` or `RealtimeManager` — both
   correctly use `Manager<T>` for their single-active-driver pattern.

## Reference

- `.kiro/steering/package-conventions.md` §"Manager base — pick the right one"
- `packages/frontend/support/src/manager.ts` — `Manager<T>` impl
- `packages/frontend/support/src/multiple-instance-manager.ts` —
  `MultipleInstanceManager<T>` impl
