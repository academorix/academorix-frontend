# finance/payment — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

Every Action under `src/Actions/**/*.php` still carries the auto-generated
`return null;` body. The models, migrations, factories, and repository contracts
land but the domain logic has not been written yet.

## Implementation plan (depends on finance/gateway landing first)

Every mutating Action routes through `PaymentGatewayManagerInterface` from
`Academorix\Gateway\Contracts\Services`. Never inject a concrete driver — the
manager resolves the right driver per (tenant, provider) tuple.

### Actions to fill (24 total)

| Action                                     | Contract                                             | Notes                                                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreatePaymentAction`                      | `POST /api/v1/payments`                              | Resolve driver via `PaymentGatewayManager::resolveFor($tenantId)`. Build `PaymentIntentRequest`. Persist `payments` row with `pending` status. Idempotent via `Idempotency-Key` header. |
| `ShowPaymentAction`                        | `GET /api/v1/payments/{payment}`                     | Read-only via repository.                                                                                                                                                               |
| `ListPaymentAction`                        | `GET /api/v1/payments`                               | Read-only via repository. Filters: status, customer_id, provider, created_at range.                                                                                                     |
| `ConfirmPaymentAction`                     | `POST /api/v1/payments/{payment}/confirm`            | Server-side confirmation path (off-session / MOTO). Route through `PaymentGatewayInterface::confirmIntent`.                                                                             |
| `CapturePaymentAction`                     | `POST /api/v1/payments/{payment}/capture`            | For authorised-only intents. Delegate to `captureIntent`. Support partial captures (amount_minor param).                                                                                |
| `CancelPaymentAction`                      | `POST /api/v1/payments/{payment}/cancel`             | For intents that haven't been captured. Delegate to `cancelIntent`.                                                                                                                     |
| `RetryPaymentAction`                       | `POST /api/v1/payments/{payment}/retry`              | For failed payments (SCA challenge, insufficient funds). Idempotent via `payments.retry_count`.                                                                                         |
| `SyncPaymentStatusAction`                  | `POST /api/v1/payments/{payment}/sync`               | Pull latest status from provider (reconciliation path).                                                                                                                                 |
| `ReceiveWebhookAction`                     | `POST /api/v1/payments/webhooks/{provider}` (public) | Bypasses auth. Verifies signature via `PaymentGatewayInterface::verifyWebhookSignature`, then hands off to `WebhookHandlerInterface::handle`.                                           |
| Platform actions (List/Show, cross-tenant) | Filtered via `filter[tenant_id]=<id>`.               |

### Support services / helpers to add

- `PaymentIntentCreator` (Actions/Support/) — orchestrates gateway call +
  persistence + event dispatch inside a `DB::transaction`.
- `PaymentReconciler` (Services/) — background job that re-reads provider intent
  status for every non-terminal payment and updates the row.

### Events to dispatch

Per blueprint `events.json`:

- `PaymentCreated` — after successful `createIntent` (status `requires_action` /
  `requires_payment_method` / `succeeded`).
- `PaymentSucceeded` — captured; wallet + invoice ledger listeners will fire.
- `PaymentFailed` — provider declined; triggers dunning if recurring.
- `PaymentCanceled` — void path.
- `PaymentRefunded` — cross-references `finance/refund`.

### Idempotency

`Idempotency-Key` header MUST be respected — the request cache holds the
response for 24h so a client retry returns the cached response instead of a
duplicate charge. Suggested implementation: `IdempotencyStore` on Redis with a
request-scoped key generator.

### PCI compliance guard

NEVER accept raw card data in request DTOs. Every payment method arrives as a
provider-side token (Stripe `pm_*`, Checkout.com `src_*`). Reject any request
body containing `card_number` / `cvv` / `exp_*` at the middleware layer.
