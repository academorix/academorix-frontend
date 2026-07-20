# payout

Stripe Connect payout mirror. The gateway executes the payout to the tenant's
connected bank account; Academorix ledgers what happened locally for reporting

- reconciliation. Not a wallet product — Academorix never touches the money.

## Owned tables

- `payouts` — one row per gateway payout event. Mirrors `provider.payouts.*`
  (Stripe). Belongs to Tenant + PaymentGatewayConfig (restrict).
- `payout_items` — line items inside a payout: order payments, refunds,
  chargebacks, marketplace fees. Signed amounts.
- `payout_reconciliations` — nightly per-tenant reconciliation report comparing
  local `SUM(payout_items.amount_minor)` vs gateway `payouts.amount_minor`.
  Drift is an incident signal.

## Flow

1. Gateway triggers `payout.created` webhook → sync task pulls payout + items.
2. Payout transitions `pending -> in_transit -> paid` via subsequent webhooks.
3. On terminal state, reconciliation job compares local vs gateway.

## Cross-references

- `finance/gateway` — webhook receiver for `payout.*` events.
- `finance/marketplace-fee` — fees deducted appear as payout_items of
  kind='fee'.
- `finance/chargeback` — chargeback reversals appear as payout_items of
  kind='chargeback'.
- `notifications/notifications` — `PayoutPaidNotification` on the terminal
  transition; `PayoutFailedNotification` on `failed`.
