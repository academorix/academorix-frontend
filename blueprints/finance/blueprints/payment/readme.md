# payment

Payment orchestration + saved payment tokens + dispute lifecycle. Wave 4 finance
infrastructure. The bridge between an invoice (money owed) and a transaction
(ledger movement) — the payment module answers "has this invoice been captured,
and what payment method did the customer use?".

## 1. What this module owns

| Concern                                | Owned artefact                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Successful money-in event              | `Payment` — one row per successful capture. IMMUTABLE after create. 7y retention (10y Enterprise).                        |
| Saved payment tokens                   | `PaymentMethod` — provider-scoped token IDs (Stripe pm_..., etc.). NEVER PAN. PCI-DSS Level 1 concern. Encrypted at rest. |
| In-flight intent objects               | `PaymentIntent` — mirrors provider intent lifecycle. 3DS2 step-up flows live here. client_secret encrypted at rest.       |
| Pre-chargeback dispute lifecycle       | `PaymentDispute` — tenant-visible; may escalate to Chargeback via chargeback module.                                      |
| Provider driver family                 | `PaymentProviderManager` (MultipleInstanceManager) — 6 drivers day-1.                                                     |
| Payment intent orchestration           | `PaymentIntentOrchestrator` — creates → confirms → succeeds → captures. Handles 3DS2 step-up.                             |
| Fraud + risk                           | `FraudChecker` — delegate to provider Radar-equivalent. Never build in-house fraud ML.                                    |
| At-rest encryption                     | `TokenEncryptor` — AES-256-GCM. Wraps provider_reference + client_secret.                                                 |
| Webhook state reconciliation           | `PaymentWebhookVerifier` + per-provider `<Provider>WebhookHandler`. HMAC-verified inbound.                                |
| Provider drift reconciliation          | `PaymentReconciler` — per-provider polling for state drift (our record ≠ provider record).                                |
| PCI-DSS scope reduction                | Customer confirms via provider SDK client-side. This API NEVER accepts raw card fields.                                   |

### 1.1 The four owned tables

- `payments` — one per successful money-in event. Belongs to `Tenant`. References `Invoice` + `PaymentIntent` + optionally `PaymentMethod` + `Transaction`. 7-year retention (financial audit; 10y Enterprise).
- `payment_methods` — saved payment tokens (provider-scoped). Belongs to `Tenant` + polymorphic customer (User / Athlete). Deduplicated per customer via fingerprint hash. Soft-deletable; 90-day grace before hard-purge.
- `payment_intents` — in-flight intent objects. Belongs to `Tenant` + `Invoice`. 90-day retention (transient state; success → creates payment row; failure → audit only).
- `payment_disputes` — per-payment dispute. Belongs to `Tenant` + `Payment`. 7-year retention (regulator audit).

None of these carry `application_id`, `region_id`, `organization_id`, `branch_id`, or `scope_node_id` — every row is tenant-scoped per tenancy-columns.md §3 with the forbidden columns of §5 explicitly absent. Enforced by the tenancy-compliance-auditor.

## 2. Where this module sits in the finance lanes

Payment sits at priority 56 — after invoice (54) + transaction (55), before refund + chargeback. The dependency shape is deliberate:

```
invoice (54)    — WHAT the customer owes
   ↓
transaction (55) — the DOUBLE-ENTRY LEDGER movement
   ↓
payment (56)    — WHO / WHEN / HOW the money moved for a specific invoice
   ↓
refund (57)     — reversing part or all of a specific payment
chargeback (58) — customer-initiated forceful reversal
```

Distinct from:

- **Invoice** — a document, a receivable, money OWED. A payment references its parent invoice via `invoice_id`.
- **Transaction** — a double-entry ledger movement. A payment references its recording transaction via `transaction_id` (nullable until the ledger recording completes).
- **Refund** — a reverse-money-out record. Owned by the refund module. References the parent Payment via `payment_id`.
- **Chargeback** — a customer-initiated forceful reversal via their bank. Owned by the chargeback module. May reference an escalated `PaymentDispute`.

## 3. The MultipleInstanceManager pattern

Per `.kiro/steering/package-conventions.md`, payment uses Laravel's canonical `Illuminate\Support\MultipleInstanceManager`:

```
PaymentProviderManager (extends MultipleInstanceManager)
    → instance('stripe_<tenant_short_id>_<config_ulid>') → StripeProvider driver
    → createStripeDriver(config: PaymentProviderConfig)
    → createPaddleDriver(config: PaymentProviderConfig)
    → createAdyenDriver(config: PaymentProviderConfig)
    → createSquareDriver(config: PaymentProviderConfig)
    → createPaypalDriver(config: PaymentProviderConfig)
    → createCustomWebhookDriver(config: PaymentProviderConfig)
    → extend(name, factory) → runtime driver registration
```

The instance name for the manager is deterministic per config row —
`<provider>_<tenant_short_id>_<config_ulid>`. Consumers call
`$manager->instance($name)` (or `$manager->forConfig($config)`) to get a
provider driver bound to the tenant's encrypted credentials.

Provider selection is NOT round-robin — the tenant configures which provider
handles which invoice (via the invoice's chosen `payment_method` or a
tenant-default provider). Each tenant may run multiple providers concurrently
(e.g. Stripe for US customers, Adyen for EU customers) via the router in
`PaymentIntentOrchestrator`.

## 4. The 6 provider drivers

Each provider ships:

1. A driver class implementing the `IPaymentProvider` contract (`name()`,
   `createIntent(...)`, `confirmIntent(...)`, `captureIntent(...)`,
   `cancelIntent(...)`, `attachPaymentMethod(...)`, `detachPaymentMethod(...)`,
   `verifyWebhookSignature(...)`).
2. A JSON Schema in `data/providers/<provider>-config.schema.json` for
   `MarketingProviderConfig.config` validation.
3. A dedicated webhook handler for provider-specific state changes.

### 4.1 The 6 providers

| Provider              | Endpoint                                                            | Auth                      | Payment method    | Intent    | Charge / dispute      |
| --------------------- | ------------------------------------------------------------------- | ------------------------- | ----------------- | --------- | --------------------- |
| Stripe                | https://api.stripe.com/v1/*                                         | Bearer sk_test/live_...*  | pm_...            | pi_...    | ch_..., dp_...        |
| Paddle                | https://api.paddle.com                                              | Bearer API key            | pm_...            | txn_...   | (via subscription)    |
| Adyen                 | https://checkout-live.adyen.com/v71/*                               | X-API-Key header          | (via storedPaymentMethodId) | (session) | dispute_id            |
| Square                | https://connect.squareup.com/v2/*                                   | Bearer                    | (via Cards API)   | (payment) | (via Disputes API)    |
| PayPal                | https://api-m.paypal.com/v2/*                                       | OAuth2                    | (via Braintree tokenization) | order_... | (via Payments API)    |
| CustomWebhook         | caller-configured                                                   | HMAC-SHA256               | caller-defined    | caller    | caller                |

### 4.2 Provider capability matrix

- **Stripe** — full feature set: Payments + Billing + Radar (risk) + 3DS2 + SetupIntents + PaymentMethods + Disputes.
- **Paddle** — Paddle Classic (checkout overlay) + Paddle Billing (v2 API). No native 3DS2 (Paddle handles it upstream).
- **Adyen** — Adyen Checkout API + Marketplaces support (multi-party split payments). Full 3DS2. Global reach + payment method breadth.
- **Square** — Square Checkout + Cards API + Disputes API + Cash App Pay (US-only).
- **PayPal** — PayPal Checkout (Orders API) + Braintree (via BT tokenization for card + PayPal) + Venmo (US-only).
- **CustomWebhook** — generic HMAC-signed webhook driver for tenant-run gateways (Braintree direct, dLocal, PayFast, etc.).

Per-provider capability details live in `data/provider-capability-matrix.json`. Each provider declares which payment_method_types it supports (card / bank_debit / bank_transfer / wallet / installment / crypto) + whether it supports manual capture, 3DS2 forced, saved methods, multi-currency, marketplaces.

## 5. The payment intent state machine

PaymentIntent is the vehicle for pre-payment orchestration. State transitions are one-way per provider convention:

```
initialized
    ↓
requires_payment_method  (customer needs to attach a method)
    ↓
requires_confirmation    (method attached; awaiting customer confirm)
    ↓
requires_action          (3DS2 step-up needed; next_action_type populated)
    ↓
processing               (provider is processing async)
    ↓
requires_capture         (authorization succeeded; manual capture flow)
    ↓
succeeded                (money captured; Payment row created atomically)

Terminal branches:
    ↓ cancelled              (customer or system cancelled)
    ↓ failed                 (provider rejected)
```

`PaymentIntentObserver` enforces the state machine. Every transition audit-logged.

The `PaymentIntent → Payment` transition happens atomically in the same DB transaction — a Payment row NEVER exists without a corresponding succeeded PaymentIntent. `PaymentObserver` refuses creation without a `payment_intent_id` pointing at `status='succeeded'`.

## 6. 3D Secure 2 / SCA compliance

PSD2 (EU) requires Strong Customer Authentication for card transactions above the SCA threshold (typically €30). The `ThreeDsGate` at the intent-create stage inspects:

- `amount_cents`
- `currency`
- Card brand + issuing country
- Tenant's `payment_3ds2_forced` entitlement (Enterprise) — forces 3DS2 on all card transactions

If 3DS2 is required, the provider's intent creation returns a `requires_action` state with:

- `next_action_type='three_d_secure_redirect'` — customer redirected to the issuing bank
- `next_action_url` — the redirect URL
- `next_action_data` — provider-specific challenge data (SDK invocation for Stripe, Adyen's `action.paymentData`, etc.)

On successful challenge, the provider webhook fires + the intent transitions to `succeeded`.

`three_ds_result` on the resulting Payment row captures the outcome:
- `authenticated` — customer completed the challenge
- `not_attempted` — merchant chose to skip (frictionless flow — provider assessed low-risk)
- `rejected` — customer failed the challenge
- `not_supported` — issuing bank doesn't support 3DS2 (fallback to 3DS1 or friction-full flow)
- `bypassed` — merchant exemption (small transaction, low-risk merchant)

`three_ds_version` captures the version ('1.0.2', '2.1.0', '2.2.0').

## 7. Webhook state reconciliation

Every provider sends webhooks for state changes we can't detect via our API calls (async 3DS challenge completion, offline auth capture, dispute opened by cardholder). The `payment.webhook_verify` middleware runs on `POST /webhooks/payment/{provider}`:

1. Extracts the provider's signature header (Stripe: `Stripe-Signature`; Paddle: `Paddle-Signature`; Adyen: `HmacSignature`; Square: `Square-Signature`; PayPal: `Paypal-Transmission-Sig`; CustomWebhook: `X-Payment-Signature`).
2. Loads the provider's `webhook_secret` from `payment_provider_configs.config` (decrypts at request time).
3. Verifies HMAC-SHA256 signature over the request body + timestamp (each provider has its own signing scheme — details in `data/providers/<provider>-config.schema.json`).
4. Rejects (400) with `payment_webhook_signature_invalid` if verification fails. No body echoed (prevents leaking internal error to the wire).
5. Passes to `<Provider>WebhookHandler` for state reconciliation.

Handlers are idempotent — the same webhook fired twice creates zero duplicates (deduplication key = provider_event_id).

## 8. Reconciliation

Payment state can drift between our DB + the provider:

- A network timeout mid-capture: our record says `pending`, provider says `succeeded`.
- A webhook is lost: provider fired `payment.succeeded`, we never received it.
- Provider-side dispute we haven't learned about yet.

`ReconcilePaymentIntentsJob` runs nightly (per config). Per active provider:

1. Fetches provider intent list (last 24h + all in-flight).
2. Diffs against our `payment_intents` rows.
3. Reconciles drift by dispatching state-update logic (e.g. mark our intent `succeeded` when the provider says so; create the missing Payment row).
4. Fires `PaymentReconcileDriftNotification` on any drift found (admin + finance).

Ops can invoke reconciliation on-demand via `POST /payment-providers/{provider}/reconcile` or `payment:reconcile --provider=stripe`.

## 9. Every successful payment triggers three side effects

`PaymentObserver.created` (fires only after the row commits — `ShouldDispatchAfterCommit`):

1. **`TransactionRecorder.record($payment)`** — double-entry ledger:
   - Debit: `cash` account (money in)
   - Credit: `accounts_receivable` for the invoice's balance
2. **`Invoice.mark_paid($payment)`** — state update on the parent invoice:
   - Full amount → `invoices.status = 'paid'` + `paid_at = payment.captured_at`
   - Partial → `invoices.status = 'partially_paid'` + `invoices.amount_paid_cents += payment.amount_cents`
3. **`marketing::CaptureMembershipPurchasedMarketingEvent`** — via the marketing module's `#[AsDomainEventMapper]` path when the parent invoice references a membership:
   - Fires domain event `finance.membership_purchased`
   - Growth module captures + fans out to ad networks

All three run in the same DB transaction as the payment insert — a Payment row NEVER exists without its transaction record + invoice state update. If any of the three fails, the whole capture rolls back.

## 10. Consent gate + PCI-DSS scope reduction

Payment is a contractual data-processing activity (GDPR Art. 6(1)(b)) — NOT consent-based. Customers cannot opt out of payment records; they can't consent themselves out of a bill they owe.

PCI-DSS Level 1 scope reduction is achieved via:

- **NO card PAN, CVV, magnetic stripe, PIN storage anywhere.** Only provider-scoped tokens (Stripe pm_..., etc.).
- **Customer confirms via provider SDK client-side.** The API never accepts raw card fields — the frontend uses Stripe Elements / Adyen Drop-in / etc., which tokenize before hitting our servers.
- **PaymentMethod.provider_reference is encrypted at rest** (AES-256-GCM) via `TokenEncryptor`.
- **PaymentIntent.client_secret is encrypted at rest.**
- **Card metadata (brand + last4 + exp_month + exp_year) is stored openly** — these are NOT PCI-DSS scope; they're payment method summary for the customer UI.
- **Device fingerprint hashed at capture time** (SHA-256); never stored raw.
- **billing_details_snapshot frozen at payment creation** (contains name + email + phone + billing address) — this IS PII but not card data; retention follows the payment retention.

## 11. Dispute lifecycle

`PaymentDispute` covers the pre-chargeback window. Not every payment dispute becomes a chargeback:

```
Warning states (provider "early warning" — no funds withdrawn yet):
    warning_needs_response
    warning_under_review
    warning_closed

Full dispute states (funds provisionally withdrawn):
    needs_response       — evidence deadline pending
    under_review         — evidence submitted; provider reviewing
    charge_refunded      — merchant chose to refund rather than fight
    won                  — merchant prevailed; funds returned
    lost                 — merchant lost; funds permanently reversed
                          → EscalateDisputeToChargebackJob creates Chargeback row
```

Evidence collection is orchestrated by `CollectDisputeEvidenceJob`:

- Invoice + line items
- Membership + service documentation (if applicable)
- Communication log with the customer (from the notifications module)
- Customer signature / receipt (if collected)
- Refund policy snapshot
- Tenant-authored uncategorized text

Evidence submission deadline is provider-communicated via `evidence_due_by`. `NotifyDisputeEvidenceDueJob` fires 3 days before the deadline.

Ops can `accept` (concede without fighting) via `POST /payment-disputes/{dispute}/accept` — creates a refund via the refund module + marks the dispute `charge_refunded`.

## 12. Tier gating

- **Small** — Stripe + Paddle + PayPal + CustomWebhook only (4 providers). Cap: 1 provider config. Saved methods enabled. Manual capture DISABLED (automatic only). Single currency.
- **Medium** — All 6 providers unlocked. Cap: 3 provider configs. Manual capture enabled (authorization holds). Multi-currency enabled.
- **Enterprise** — All 6 providers. Unlimited configs. 3DS2 forced enabled. CustomWebhook enabled. 10-year retention available.

Enforced by `payment_capture` (master) + `payment_provider_slot` (config cap) + `payment_advanced_providers` (Medium+ = Adyen + Braintree + Square) + `payment_manual_capture` (Medium+) + `payment_saved_methods` (Small+) + `payment_multi_currency` (Medium+) + `payment_3ds2_forced` (Enterprise) + `payment_dispute_management` (Small+) + `payment_custom_webhook` (Enterprise) + `payment_extended_retention` (Enterprise).

## 13. Compliance

- **PCI-DSS Level 1** — never store card PAN, CVV, magnetic stripe, PIN. Only provider-scoped tokens. Customer confirms via provider SDK client-side.
- **PSD2 (EU) + SCA** — 3DS2 for card transactions > €30 (or per tenant configuration).
- **3DS2 (EMVCo)** — challenge flow for step-up authentication.
- **GDPR Art. 6(1)(b)** — contractual basis for payment processing (no consent required).
- **GDPR Art. 15** — customer can request their payment history export.
- **GDPR Art. 17** — TenantErased cascades hard-delete except immutable financial records → archived per Art. 17 §3 exception.
- **AML** — payment records retained + submitted per regulator when requested (7y baseline; 10y Enterprise).
- **CCPA** — customer can request payment method deletion (soft-delete + provider-side detach; historical Payment rows survive per financial retention).
- **SOX §404** — audit trail on every state transition (Auditable trait, 7y retention).

## 14. What this module does NOT do

- **Card PAN / CVV storage** — TOKENS ONLY (PCI-DSS Level 1).
- **Provider-agnostic payment method** — each provider has distinct token format. Attempts to bridge them via a canonical shape have failed in production (customer paid via Stripe with pm_X; migrating to Adyen requires the customer to re-attach).
- **Cryptocurrency support** — v1 fiat only. Crypto-payment gateways can be integrated later via CustomWebhook.
- **BNPL (Buy Now Pay Later) as a native provider** — via Stripe/Adyen/Klarna integrations only (the provider handles the BNPL customer flow).
- **Cross-tenant payment methods** — tenant isolation. Even shared providers (Stripe accounts owned by different tenants) don't share tokens.
- **`application_id` / `region_id` / `organization_id` / `branch_id` / `scope_node_id` on any row.**
- **Direct card-form endpoint** — customer confirms via provider SDK. PCI-DSS scope reduction.
- **Fraud detection ML** — delegated to provider Radar-equivalent. Never build in-house fraud ML.
- **Mutation of Payment rows after create** — payments are IMMUTABLE. Corrections happen via credit notes on the invoice + refunds on the payment (separate modules).

## 15. Cross-references

- `hierarchy.md` §7 — tier matrix (feature gating).
- `hierarchy.md` §1b — payment vocabulary (Payment / PaymentMethod / PaymentIntent / PaymentDispute).
- `tenancy-columns.md` §3 — every payment table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every payment row.
- `.kiro/steering/package-conventions.md` — MultipleInstanceManager shape.
- `modules/finance/blueprints/invoice/` — the parent record for every payment.
- `modules/finance/blueprints/transaction/` — the double-entry ledger movement recorded per payment.
- `modules/growth/blueprints/marketing/` — canonical multi-provider fan-out reference (this module follows the same MultipleInstanceManager pattern).
- `modules/compliance/blueprints/consent/` — payment is Art. 6(1)(b) contractual, not consent-based, but this module respects consent for related marketing signals.
