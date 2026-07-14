# entitlements

Per-workspace quota + usage tracking substrate. Wave 5 infrastructure. Consumed by every metered feature module.

## 1. What this module owns

| Concern | Owned artefact |
| --- | --- |
| Resolved caps per workspace | `Entitlement` |
| Consumption audit trail | `EntitlementUsage` |
| Redis-backed hot-path enforcement | `Enforcer` binding |
| Plan → Entitlement synchronisation | `PlanEntitlementSyncer` |
| Usage export to Stripe/Paddle | `ExportUsageForBillingJob` |
| Attribute-driven consume points | `#[ConsumesEntitlement]` on service methods |

## 2. Entitlement kinds

Every entitlement key across the platform (~30+ declared across module `entitlements.json` blueprints) resolves to one of four kinds:

| Kind | Semantics | Example |
| --- | --- | --- |
| `slot` | Hard cap on **concurrent** count. Incremented on create, decremented on delete. | `webhook.subscriptions.count = 25` |
| `pool` | Periodic **quota** with automatic reset at period boundary. | `webhook.deliveries.month = 500000` |
| `boolean` | Feature toggle. True/false based on plan. | `activity.extended_retention = true` |
| `unlimited` | No cap. Enforcer short-circuits with `allowed`. | Enterprise-plan pool overrides. |

## 3. Data flow

```
Workspace created
    └─ create Entitlement rows for every #[Entitlement] declared in modules/*/entitlements.json
       (values from Plan.default_entitlements, else config defaults)

Metered operation (e.g. DispatchWebhookJob)
    └─ Enforcer::consume('webhook.deliveries.month', 1)
        ├─ Redis: INCR quota:{workspace}:{key}  (atomic hot path)
        ├─ Check vs Entitlement.value_cap
        │   ├─ If exceeded → throw QuotaExceeded (HTTP 402), fire EntitlementExceeded
        │   └─ Else → allow + async persist to EntitlementUsage
        └─ Fires EntitlementConsumed (afterCommit)

Period boundary reached (monthly / yearly / anniversary)
    └─ ResetPeriodicUsageJob (from schedule)
        ├─ For each pool Entitlement past resets_at:
        │   ├─ Reset value_used = 0
        │   ├─ Compute next resets_at
        │   └─ Fire EntitlementReset

Subscription plan changed (from subscription module)
    └─ SyncEntitlementsFromPlanJob
        ├─ Load Plan.default_entitlements
        ├─ Apply Workspace.entitlement_overrides (platform-admin negotiated)
        ├─ UPSERT Entitlement rows to match
        └─ Fire EntitlementSyncCompleted
```

## 4. Attribute-driven consumption

Modules opt in via attributes on their service methods:

```php
use Academorix\Entitlements\Attributes\ConsumesEntitlement;

final class WebhookDispatcher
{
    #[ConsumesEntitlement(key: 'webhook.deliveries.month', amount: 1)]
    public function dispatch(WebhookDelivery $delivery): void
    {
        // Method body runs only if enforce() passes.
        // Otherwise throws QuotaExceeded.
    }
}
```

The build-time discovery pass wraps decorated methods with a `beforeCall` hook that calls `Enforcer::enforce()`. On success, `Enforcer::consume()` fires after the method returns without exception.

## 5. Hot path performance

Enforcement runs on every metered operation. Redis is the hot path:

- `INCR quota:{workspace_id}:{key}:{period_bucket}` — atomic, < 1ms
- Compared against cached `value_cap` (also in Redis, 5-min TTL)
- Postgres write asynced via queue (batched every 5s)

Reconciliation runs hourly via `ReconcileUsageJob` to sync Redis counters to Postgres in case of drift.

## 6. Plan → Entitlement sync

The `subscription` module fires `SubscriptionUpgraded` / `SubscriptionDowngraded` events. Our `SyncEntitlementsFromPlanListener` picks them up and dispatches `SyncEntitlementsFromPlanJob`. The job:

1. Loads the new Plan's `default_entitlements` map
2. Applies the Workspace's `entitlement_overrides` JSONB (enterprise negotiations)
3. UPSERTs each `Entitlement` row
4. Preserves `value_used` (usage doesn't reset on plan change — only on period reset)
5. Fires `EntitlementSyncCompleted`

## 7. Usage-based billing export

For pool-kind entitlements marked `is_metered_billing=true`, `ExportUsageForBillingJob` runs at period end and calls Cashier's `subscription()->reportUsage($key, $amount)`. Stripe/Paddle then invoices the overage.

## 8. Files

Standard blueprint. Schemas: 2 entities (`entitlement`, `entitlement-usage`).

## 9. What this module does NOT do

- **Doesn't own plan definitions.** That's the `subscription` module.
- **Doesn't own payment.** Billing exports through Cashier; provider handles the money.
- **Doesn't own feature flags.** Feature flags are the `feature-flag` module (or Pennant). Entitlements are the ANSWER to "how much can this workspace do"; feature flags are "can this workspace SEE this feature at all".
