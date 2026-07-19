# entitlements

Per-tenant quota + usage tracking substrate. Wave 5 infrastructure. Consumed by
every metered feature module.

## 1. What this module owns

| Concern                            | Owned artefact                              |
| ---------------------------------- | ------------------------------------------- |
| Resolved caps per tenant           | `Entitlement`                               |
| Consumption audit trail            | `EntitlementUsage`                          |
| Redis-backed hot-path enforcement  | `Enforcer` binding                          |
| Plan → Entitlement synchronisation | `PlanEntitlementSyncer`                     |
| Usage export to Stripe/Paddle      | `ExportUsageForBillingJob`                  |
| Attribute-driven consume points    | `#[ConsumesEntitlement]` on service methods |

## 2. Entitlement kinds

Every entitlement key across the platform (~30+ declared across module
`entitlements.json` blueprints) resolves to one of four kinds:

| Kind        | Semantics                                                                       | Example                              |
| ----------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| `slot`      | Hard cap on **concurrent** count. Incremented on create, decremented on delete. | `webhook.subscriptions.count = 25`   |
| `pool`      | Periodic **quota** with automatic reset at period boundary.                     | `webhook.deliveries.month = 500000`  |
| `boolean`   | Feature toggle. True/false based on plan.                                       | `activity.extended_retention = true` |
| `unlimited` | No cap. Enforcer short-circuits with `allowed`.                                 | Enterprise-plan pool overrides.      |

## 3. Data flow

```
Tenant created
    └─ create Entitlement rows for every #[Entitlement] declared in modules/*/entitlements.json
       (values from Plan.default_entitlements, else config defaults)

Metered operation (e.g. DispatchWebhookJob)
    └─ Enforcer::consume('webhook.deliveries.month', 1)
        ├─ Redis: INCR quota:{tenant}:{key}  (atomic hot path)
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
        ├─ Apply Tenant.entitlement_overrides (platform-admin negotiated)
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

The build-time discovery pass wraps decorated methods with a `beforeCall` hook
that calls `Enforcer::enforce()`. On success, `Enforcer::consume()` fires after
the method returns without exception.

## 5. Hot path performance

Enforcement runs on every metered operation. Redis is the hot path:

- `INCR quota:{tenant_id}:{key}:{period_bucket}` — atomic, < 1ms
- Compared against cached `value_cap` (also in Redis, 5-min TTL)
- Postgres write asynced via queue (batched every 5s)

Reconciliation runs hourly via `ReconcileUsageJob` to sync Redis counters to
Postgres in case of drift.

## 6. Hot-path resilience: fail-open vs fail-closed

The Redis hot path CAN fail — Redis unreachable, network partition, timeout, key
eviction under memory pressure. What happens then is a **policy choice**, not an
implementation detail. The default is **fail closed**; a Pennant flag opts into
**fail open** during declared incidents.

**Fail closed (default, `entitlements.graceful_degradation_mode=off`).** When
the hot-path check errors, `Enforcer::consume()` raises `EntitlementCheckFailed`
(retryable, HTTP 503). Every consumer catches + surfaces the error to its
caller. Correctness wins over availability — an uncapped tenant is a billing
anomaly, not just a slow request.

**Fail open (`entitlements.graceful_degradation_mode=on`).** The hot-path error
is swallowed; the operation is permitted;
`academorix.entitlement.fail_open_total{key,reason}` increments. Reason labels:
`redis_timeout`, `redis_unreachable`, `redis_evicted`,
`postgres_fallback_failed`. Every fail-open event is logged at WARN with the
tenant + key + failure mode. Turn on only during declared incidents where
refusing metered operations does more damage than temporarily over-serving (e.g.
Redis cluster failover mid-billing-period, when notifications backing up in the
queue would cause a delivery SLA breach).

**Trade-off summary.**

| Mode                  | Correctness                  | Availability                          | When to use                                                                                                              |
| --------------------- | ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| fail closed (default) | Never over-serve             | Rejects operations on hot-path outage | Steady state. Correctness matters more than a small outage window.                                                       |
| fail open (opt-in)    | May over-serve during outage | Permits every operation               | Declared incident where refusing operations breaks a customer-facing SLA that costs more than the over-service exposure. |

**Operational rules.**

- Flag flip is a runbook step, not a config change; requires on-call SRE +
  billing-oncall dual approval.
- Auto-disable after 60 minutes if the flag is toggled on manually.
- Every fail-open window is documented in the incident retro with: duration,
  tenants affected, total fail-open count, over-serve estimate in currency
  terms.
- Alert routing: WARN when metric > 100 events / minute (routes to SRE); PAGE
  when > 1000 events / minute (routes to on-call + billing).
- Reconciliation on flag flip: `ReconcileUsageJob` runs immediately when the
  flag flips OFF to snap Redis back to the Postgres source-of-truth counters.

## 7. Plan → Entitlement sync

The `subscription` module fires `SubscriptionUpgraded` /
`SubscriptionDowngraded` events. Our `SyncEntitlementsFromPlanListener` picks
them up and dispatches `SyncEntitlementsFromPlanJob`. The job:

1. Loads the new Plan's `default_entitlements` map
2. Applies the Tenant's `entitlement_overrides` JSONB (enterprise negotiations)
3. UPSERTs each `Entitlement` row
4. Preserves `value_used` (usage doesn't reset on plan change — only on period
   reset)
5. Fires `EntitlementSyncCompleted`

## 8. Usage-based billing export

For pool-kind entitlements marked `is_metered_billing=true`,
`ExportUsageForBillingJob` runs at period end and calls Cashier's
`subscription()->reportUsage($key, $amount)`. Stripe/Paddle then invoices the
overage.

## 9. Files

Standard blueprint. Schemas: 2 entities (`entitlement`, `entitlement-usage`).

## 10. What this module does NOT do

- **Doesn't own plan definitions.** That's the `subscription` module.
- **Doesn't own payment.** Billing exports through Cashier; provider handles the
  money.
- **Doesn't own feature flags.** Feature flags are the `feature-flag` module (or
  Pennant). Entitlements are the ANSWER to "how much can this tenant do";
  feature flags are "can this tenant SEE this feature at all".
