# finance/marketplace-fee — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Marketplace fee = Academorix platform take-rate. Every tenant-collected
payment carries a `platform_fee_minor` that Stripe routes to the platform
account via Stripe Connect's `application_fee_amount` parameter.

This module owns:
1. The fee rate config per tenant (rate_percent + fixed_minor + waived).
2. The fee row that mirrors Stripe's `application_fee` object per payment.
3. Refund cascade — when a payment is refunded, the corresponding
   marketplace fee is refunded back to the tenant.

### Actions to fill (13 total)

Standard CRUD on `marketplace_fee_configs` + `marketplace_fees`
(tenant-facing read + platform-admin read/write).

- `ListMarketplaceFeeConfigAction` — GET tenant's fee configs.
- `CreateMarketplaceFeeConfigAction` — platform-admin only.
- `UpdateMarketplaceFeeConfigAction` — platform-admin only.
- `DeleteMarketplaceFeeConfigAction` — platform-admin only.
- `ShowMarketplaceFeeConfigAction`
- `ListMarketplaceFeeAction` — GET fees collected on this tenant.
- `ShowMarketplaceFeeAction`
- `RefundMarketplaceFeeAction` — POST admin refund of a fee (used when
  Academorix waives a fee after the fact).
- Platform actions — cross-tenant analytics.

### Support services

- `MarketplaceFeeCalculator` (Services/) — computes the fee for a payment
  amount + tenant fee config. Called by `finance/payment::CreatePayment`
  to populate `application_fee_amount`.
- `MarketplaceFeeReconciler` (Services/) — nightly job that cross-checks
  collected fees against Stripe's `application_fees` list.

### Events

- `MarketplaceFeeCollected` — from `PaymentSucceeded` webhook.
- `MarketplaceFeeRefunded` — from `RefundIssued` cascade.
- `MarketplaceFeeConfigUpdated` — audit trail.

### Integration point

`finance/payment::CreatePayment` MUST read the fee config + populate
`PaymentIntentRequest.platformFeeMinor` before handing to the gateway.
Never compute fees ad-hoc at the payment site.
