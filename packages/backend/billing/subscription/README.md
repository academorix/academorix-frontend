# academorix/subscription

Tenant subscription lifecycle. Wave 5 infrastructure. Wraps `laravel/cashier`
for payment-provider-agnostic billing (Stripe + Paddle).

See `modules/billing/blueprints/subscription/readme.md` for the full design
narrative.

## What this package owns

- `Plan` — per-Application plan catalogue with `default_entitlements` map.
- `Subscription` — tenant's active plan, wrapping Cashier's own row via
  `provider_subscription_id`; adds our own state layer with grace period beyond
  provider default.
- `SubscriptionEvent` — 7-year append-only SOX audit trail of every state
  transition.

## Layers ship attribute-first per the repo's canonical shape

- `#[Bind]` on the interfaces (Pattern A).
- `#[AsRepository]` + `#[Cacheable]` + `#[Filterable]` on the repositories.
- `#[AsAction]` + verb attribute + `#[RequirePermission]` on every action.
- `#[AsSeeder(priority: 49)]` on the permission seeder — composes
  `SeedsPermissionEnum`.
- `#[AsEvent]` on every event.
- `#[ObservedBy]` + `#[UsePolicy]` on the models.
