# gateway

Multi-provider payment-gateway abstraction. Every tenant configures their own
provider (Stripe / Paddle / Checkout.com / Square / Razorpay / Custom) with
encrypted credentials, and every finance action resolves the tenant's active
gateway through `PaymentGatewayInterface`.

Per DL-4 / DL-5 in `tasks.md`:

- Stripe Connect for tenant commerce (Parents → Academy) — charge splits at
  charge time: tenant Connect account receives `charge - platform_fee`;
  Academorix platform account receives the platform fee.
- Paddle for SaaS billing (Academy → Academorix) — handled by
  `billing/subscription`, not this module.
- Multi-gateway per tenant — the abstraction lets tenants pick their own
  provider without code changes.

## Owned tables

- `payment_gateway_configs` — one active row per `(tenant_id, provider)`.
  Credentials encrypted at rest.
- `payment_methods` — tokenized cards on file at `owner_type = guardian` or
  `tenant`. Never stores raw card data.
- `gateway_webhook_events` — inbound webhook ledger, idempotent on
  `(tenant_id, provider, provider_event_id)`.

## Cross-references

- `finance/payment` consumes `PaymentGatewayInterface` for charge/refund calls.
- `finance/payout` reads `payment_gateway_configs.connect_account_id`.
- `finance/marketplace-fee` applies fee splits via Stripe Application Fees.
- `notifications/notifications` fires on `PaymentGatewayFailureNotification`.
