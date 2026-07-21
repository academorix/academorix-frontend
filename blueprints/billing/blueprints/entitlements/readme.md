# stackra/entitlements

Per-tenant quota + usage tracking substrate for Stackra. Consumed by every
metered feature module (webhook, notifications, storage, newsletter, search).

## Aggregates

| Aggregate          | ULID prefix | Purpose                                                                                                            |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `Entitlement`      | `ent_`      | Resolved cap for a `(tenant, key)` tuple — one of four kinds (slot / pool / boolean / unlimited). Source-of-truth. |
| `EntitlementUsage` | `usg_`      | Append-only audit row for one consumption event. Aggregated per period for pool-kind entitlements.                 |

## Entitlement kinds

| Kind        | Semantics                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `slot`      | Hard cap on concurrent count (e.g. `webhook.subscriptions.max`). Consumption ≤ `limit`; refunded on delete.              |
| `pool`      | Periodic quota with reset (e.g. `ai.tokens.month`). `used` resets at period boundary (monthly / anniversary / lifetime). |
| `boolean`   | Feature toggle (e.g. `analytics.enabled`). Value is `true` / `false`.                                                    |
| `unlimited` | Enterprise sentinel — every `consume()` succeeds. No usage rows written.                                                 |

## Install

```bash
composer require stackra/entitlements
```

## Contributes

- **Traits**: `HasEntitlements` (mixed into Tenant) + `MetersUsage` (mixed into
  models that consume metered features).
- **Attributes**: `#[ConsumesEntitlement(key, kind, defaultValue, period?)]`
  (class-level — declares an entitlement key at boot) +
  `#[EnforcesEntitlement(key, amount)]` (method-level — auto-consumes before
  invocation).
- **Middleware**: `entitlement.enforce` — parameterised
  (`entitlement.enforce:webhook.subscriptions.max`). Refuses with HTTP 402
  Payment Required + JSON error payload when the entitlement is exceeded.
- **Permissions (3)**: dual-guard (`View` on sanctum + `ViewAll` + `Manage` on
  platform_admin) via `EntitlementsPermission`.
- **Events (8)**: `EntitlementResolved`, `EntitlementConsumed`,
  `EntitlementExceeded`, `EntitlementReset`, `EntitlementOverridden`,
  `EntitlementSyncStarted`, `EntitlementSyncCompleted`,
  `UsageReportedToBilling`.
- **Jobs (5)**: `ResetPeriodicUsageJob`, `ReconcileUsageJob`,
  `ExportUsageForBillingJob`, `SyncEntitlementsFromPlanJob`,
  `ApplyEntitlementOverrideJob`.
- **Commands (6)**: `entitlements:seed`, `entitlements:describe`,
  `entitlements:reset`, `entitlements:report-usage`, `entitlements:reconcile`,
  `entitlements:sync-plan`.
- **Services**: `EntitlementResolver` (Redis-cached hot path),
  `EntitlementRegistry` (in-memory registry populated by discovery),
  `UsageRecorder`, `Enforcer`, `NullPlanEntitlementSyncer` (default —
  subscription module overrides), `UsageAggregator`.
- **Rules (2)**: `valid_entitlement_key`, `valid_entitlement_kind`.
- **Casts**: `EntitlementValue` — schema-aware cast for the value jsonb.

## Consumer flow

```php
// 1. Domain class declares its entitlement keys at build time.
#[ConsumesEntitlement(
    key: 'webhook.subscriptions.max',
    kind: EntitlementKind::Slot,
    defaultValue: ['limit' => 10, 'used' => 0],
)]
final class WebhookSubscription extends Model { /* ... */ }

// 2. Feature action opts into enforcement via middleware OR the trait.
#[Post('/api/v1/webhook/subscriptions')]
#[Middleware(['api', 'auth:sanctum', 'entitlement.enforce:webhook.subscriptions.max'])]
final class CreateSubscription { /* ... */ }

// 3. Or invoke the enforcer directly for a scoped consumption.
$this->enforcer->consume($tenantId, 'webhook.subscriptions.max', amount: 1);
```

## Cache strategy

Repository ships `#[Cacheable(ttl: 60, tags: true)]` on the resolver hot path.
Redis is the drift-tolerant hot cache; Postgres is the source of truth. The
`ReconcileUsageJob` writes corrections when Redis-Postgres drift exceeds
`entitlements.redis.tolerance` (default 100).

## Tests

```bash
composer install
vendor/bin/pest
```
