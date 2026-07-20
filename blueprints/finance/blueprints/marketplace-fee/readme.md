# marketplace-fee

Academorix's take-rate on Parents → Academy transactions. Per DL-5 (tasks.md),
Stripe Connect is the default gateway and fee-splits happen at charge time via
Stripe Application Fees: the tenant Connect account receives
`charge - platform_fee` and the Academorix platform account receives the
platform fee.

## Not to be confused with

- `finance/gateway` — the multi-gateway abstraction. This module SITS ON TOP of
  gateway and adds fee splitting.
- `finance/order.order_adjustments` — per-order fees (e.g. tax, convenience).
  This module is the platform's cut, deducted from every transaction.

## Owned tables

- `fee_schedules` — per-tenant fee configuration. Multiple versions retain
  history (an increase applies to future transactions, never retroactively).
  Belongs to Tenant + Application (cascade). Fields: `application_id`,
  `tenant_id`, `version`, `effective_from`, `effective_to`, `base_rate`
  (decimal, e.g. 0.0290 = 2.9%), `flat_fee_minor`, `currency`, `tiers_json`
  (progressive tier config), `is_active`.
- `fee_applications` — one row per transaction where a fee was applied. Belongs
  to Tenant + Payment (restrict) + FeeSchedule (restrict). Contains
  `calculated_fee_minor`, `stripe_application_fee_id`, `applied_at`.
- `fee_payouts` — Academorix-facing payout of fees to the platform account.
  Roll-up over `fee_applications` in a period. Belongs to Tenant + Application
  (cascade).

## Cross-references

- `finance/payment` — reads active fee schedule to compute `application_fee`
  for Stripe.
- `finance/payout` — fees appear on tenant payouts as `payout_items` of
  `kind='fee'`.
- `finance/gateway` — the underlying Stripe adapter passes the calculated fee
  to `payment_intents.create({ application_fee_amount })`.
