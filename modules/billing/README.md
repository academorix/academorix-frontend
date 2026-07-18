# `modules/billing/` — billing-service blueprints

**Money + entitlements** — what a tenant pays and what that payment entitles
them to. The two are inseparable and co-located here:

> "The tenant is on the Pro plan (Subscription) which lets them run 100 AI
> queries per month (Entitlements)."

Deploys to `academorix-backend/apps/billing-service/` (see
[`apps/billing-service/README.md`](../../../academorix/academorix-backend/apps/billing-service/README.md)).

## Modules — on disk

| Module                                      | Wave | Priority | Schemas | Purpose                                                                                                                                                                                                     |
| ------------------------------------------- | ---- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`entitlements/`](./entitlements/readme.md) | 3    | 22       | 2       | `EntitlementGate` facade + slot / pool / boolean / unlimited license kinds. Redis hot path, Postgres source of truth. Every entitlement-gated write in every service calls `EntitlementGate::consume(...)`. |
| [`subscription/`](./subscription/readme.md) | 3    | 29       | 3       | `TenantSubscription` (Cashier mirror), plans, trials, grace periods, coupons, credits, refunds, chargebacks, metered-usage export. Cashier-backed (Stripe + Paddle).                                        |

**Total on disk: 2 modules, 5 schemas.**

## Why the two modules live together

`entitlements` boots BEFORE `subscription` (priority 22 < 29) because
`subscription` depends on `entitlements`: on `PlanChanged`, subscription re-runs
the `EntitlementProvisioner` to refresh entitlement rows.

Split rationale: `subscription` owns the money side (contracts, invoices,
payment provider mirrors); `entitlements` owns the capability side
(what-you-may-do). Every domain module gates on **entitlements**, not on plan
names — `if ($tenant->tier === 'enterprise')` in a policy is a bug (see
`hierarchy.md` §7). This split lets domain code stay stable when plan catalogues
change.

## Provider webhooks (inbound)

Inbound Cashier webhooks (Stripe → us, Paddle → us) land here as **receiver
controllers**, not in the platform `webhook/` module. The platform `webhook`
substrate is for OUTBOUND webhooks (Academorix → tenant URLs). Inbound is
provider-specific + billing-owned.

Flow: Cashier webhook → receiver translates the raw provider event into our own
domain event (`SubscriptionUpgraded`, `Cancelled`, `PaymentFailed`, …) →
subscription writes to its tables → `EntitlementProvisioner` refreshes
`Entitlement` rows → downstream services see the change on their next gate call.

## Cross-cutting invariants

- **`TenantSubscription` ≠ `Finance\Membership`** — the former is the _academy
  paying Academorix_ (SaaS billing); the latter (future, in a product monolith)
  is a _parent paying an academy_. Never conflate; the domain vocabulary in
  `hierarchy.md` §1b enforces the two nouns.
- **`tenant_subscriptions` + `entitlement_licenses` carry `application_id`
  directly** — two of the eight rows in
  [`tenancy-columns.md`](../../.kiro/steering/tenancy-columns.md) §2.
- **Entitlements are per-Application** — a tenant's Sports entitlements don't
  grant Marketplace capabilities. Composite key is
  `(application_id, tenant_id, feature_key)`.

## Tier + downgrade behaviour

Tier transitions (Small ↔ Medium ↔ Enterprise per `hierarchy.md` §7) go through
the entitlement provisioner + reconciler:

- **Upgrade** — quotas expand, feature flags flip on. Immediate.
- **Downgrade** — deferred to period end. At the boundary,
  `EntitlementReconciler` handles over-quota state: freeze new invites, freeze
  new branches, flatten Organization hierarchy on non-default orgs.
- **Cancel** — `SubscriptionStatus::grace_period` for the plan's grace window;
  entitlements stay active. On expiry, transition to `lapsed`; reads-only stance
  applies to entitlement-gated write paths.

## For agents

- **Never gate on plan name.** Always gate on
  `EntitlementGate::isFeatureEntitled('feature_key')` or
  `EntitlementGate::consume('slot_key')`.
- **Read `entitlements/` before touching `subscription/`.** Every subscription
  lifecycle event fans out through the entitlement provisioner.
- **Cashier webhooks live in billing-service, not platform's webhook module.**
  Don't route inbound provider events through the outbound webhook substrate.

## Related

- `../README.md` — master index.
- `.kiro/specs/platform-architecture/DECISION.md` §4 — module→service map.
- `.kiro/steering/hierarchy.md` §7 — tier matrix + capabilities.
- `.kiro/steering/hierarchy.md` §8 — entitlement key registry (canonical names).
- `.kiro/steering/hierarchy.md` §10 — tier transitions.
- `.kiro/steering/tenancy-columns.md` §2 — the eight `application_id`-bearing
  rows.
