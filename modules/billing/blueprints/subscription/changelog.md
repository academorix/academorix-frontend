# subscription — changelog

## [Unreleased] — inception

- Subscription platform authored. Three entities: `Plan`, `Subscription`,
  `SubscriptionEvent`.
- Wraps `laravel/cashier` — supports both Stripe + Paddle via per-Application
  selection.
- Grace period logic beyond provider default (past_due → at_risk → grace →
  suspended → cancelled).
- Plan → Entitlement sync via listener (dispatches `SyncEntitlementsFromPlanJob`
  on subscription changes).
- Metered usage export via Cashier's `reportUsage()`.
- Enterprise contract offline billing shape (`Plan.billing_mode = 'invoice'`).
- Cashier webhook consumption via `webhook` module (namespace=subscription).
- 7-year SOX retention on `SubscriptionEvent` audit rows.

### Compatibility

- Depends on `foundation`, `tenants`, `entitlements`, `activity`, `audit`,
  `notifications`, `notifications-mail`.
- Inception release.
