# entitlements — changelog

## [Unreleased] — inception

- Entitlements platform authored. Two entities: `Entitlement`,
  `EntitlementUsage`.
- Four kinds: `slot`, `pool`, `boolean`, `unlimited`.
- Redis-backed hot-path Enforcer + Postgres source-of-truth.
- Attribute-driven `#[ConsumesEntitlement]` for service methods.
- `HasEntitlements` mixed into `Tenant`; `MetersUsage` trait for consumer
  models.
- Plan → Entitlement sync via `SyncEntitlementsFromPlanJob` (dispatched by
  subscription module on plan change).
- Usage-based billing export via `ExportUsageForBillingJob` (Stripe/Paddle
  Cashier reportUsage).
- Monthly / anniversary / lifetime reset windows via `ResetPeriodicUsageJob`
  (daily schedule).
- Platform-admin override surface for enterprise contract negotiations.

### Compatibility

- Depends on `foundation`, `tenants`, `activity`, `audit`.
- Consumed by every metered feature module (see `module.json.extendedBy`).
- Inception release — no breaking-change surface.
