# payment — changelog

## [Unreleased] — inception (Wave 4)

- Payment module authored. Four owned entities:
  - `Payment` — one row per successful money-in event. Immutable after create.
    References invoice + payment_intent + transaction + optional payment_method.
    7-year retention (financial audit; 10y Enterprise).
  - `PaymentMethod` — saved payment tokens (provider-scoped). Deduplicated per
    customer via fingerprint hash. Soft-deletable; 90-day grace before
    hard-purge.
  - `PaymentIntent` — in-flight intent objects mirroring provider intent
    lifecycle. Client_secret + provider_reference encrypted at rest. 90-day
    retention (transient state).
  - `PaymentDispute` — per-payment dispute with evidence submission window. May
    escalate to Chargeback via chargeback module. 7-year retention.
- Nine entitlement gates:
  - `payment_capture` (boolean, all tiers) — master feature gate.
  - `payment_provider_slot` (integer per tier — Small=1, Medium=3, Enterprise=∞)
    — how many provider configs.
  - `payment_advanced_providers` (Medium+) — Adyen / Square (Small only:
    Stripe + Paddle + PayPal + CustomWebhook).
  - `payment_manual_capture` (Medium+) — authorization holds with delayed
    capture.
  - `payment_saved_methods` (all tiers) — save tokens for repeat customers.
  - `payment_multi_currency` (Medium+) — dispatch payments in multiple
    currencies.
  - `payment_3ds2_forced` (Enterprise) — force 3DS2 on all card transactions.
  - `payment_dispute_management` (all tiers) — dispute workflow.
  - `payment_custom_webhook` (Enterprise) — generic HMAC-signed webhook driver.
  - `payment_extended_retention` (Enterprise) — 7y → 10y retention window.
- MultipleInstanceManager pattern via `PaymentProviderManager` with 6 drivers
  day-1: stripe, paddle, adyen, square, paypal, custom_webhook.
- Per-provider webhook verification via `payment.webhook_verify` middleware
  (Stripe-Signature, Paddle-Signature, Adyen-HmacSignature, Square-Signature,
  Paypal-Transmission-Sig, X-Payment-Signature for CustomWebhook).
- 3DS2 / SCA compliance built-in via `ThreeDsGate` — inspects amount +
  currency + card brand + issuing country to determine when 3DS2 is required.
  Threshold configurable per tenant.
- Payment intent state machine: initialized → requires_payment_method →
  requires_confirmation → requires_action (3DS2) → processing → requires_capture
  (manual) → succeeded (terminal) / cancelled / failed.
- Fraud detection delegated to provider Radar-equivalent via `FraudChecker`
  service — never in-house ML.
- At-rest encryption via `TokenEncryptor` (AES-256-GCM) on
  payment_method.provider_reference + payment_intent.provider_reference +
  payment_intent.client_secret.
- PCI-DSS Level 1 scope reduction — NO card PAN/CVV/magnetic-stripe/PIN storage
  anywhere. Only provider-scoped tokens. Customer confirms via provider SDK
  client-side.
- Sequential payment_number generation per tenant (PAY-2026-00000001) via
  Postgres advisory lock.
- Every successful payment atomically triggers:
  - Transaction.record via TransactionRecorder (double-entry: debit cash, credit
    accounts_receivable).
  - Invoice.mark_paid (partial or full state update on parent invoice).
  - marketing::CaptureMembershipPurchasedMarketingEvent (attribution via
    growth::marketing module).
- Dispute evidence collection orchestrated by CollectDisputeEvidenceJob —
  auto-collects invoice + membership + notification history for evidence pack.
- Nightly reconciliation via ReconcilePaymentIntentsJob — polls provider intent
  lists + reconciles drift.
- Retry with exponential backoff on transient failures via
  ConfirmPaymentIntentJob + CapturePaymentIntentJob.
- Cascade paths: TenantErased → FK CASCADE with financial-record archive
  exception (Art. 17 §3); UserErased → subject_id nulled on payments +
  payment_methods soft-deleted + provider-side detach; TenantSuspended →
  payment_methods soft-deleted (payments preserve state).
- 26 events published; 11 notification classes; 10 background jobs; 14 Artisan
  commands; 5 broadcast channels; 14 validation rules; 1 middleware
  (payment.webhook_verify).
- SDUI: 15 screens across 5 resources (payment / payment-method / payment-intent
  / payment-dispute / payment-provider) + 5 widgets (payment-status-chip /
  method-brand-badge / dispute-status-chip / 3ds-badge / risk-score-indicator).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`,
  `compliance`, `invoice`, `transaction`.
- Extended by NONE. Wave 4 sibling modules (refund + chargeback) + Wave 5
  growth::marketing are PLANNED consumers — they read payment rows via injected
  services + subscribe to payment events; they do NOT extend the payment module.
- Wave 4 inception release.

### Design notes

- Payment does NOT carry `application_id` / `region_id` / `organization_id` /
  `branch_id` / `scope_node_id`. Every row is tenant-scoped per
  tenancy-columns.md §3, with the forbidden columns of §5 explicitly absent.
- Every write to payments / payment_methods / payment_intents / payment_disputes
  emits an audit row (Auditable trait) with 7-year retention (financial audit;
  10y Enterprise).
- Payment records are IMMUTABLE after create — financial records are never
  mutated, only credit-noted (on the invoice side) or refunded (via refund
  module).
- A Payment row NEVER exists without a corresponding succeeded PaymentIntent —
  enforced by PaymentObserver.creating refusing insertion without payment_intent
  status='succeeded'.
- A Payment's TransactionRecorder call + Invoice.mark_paid call + marketing
  capture event all run in the same DB transaction as the payment insert. If any
  step fails, the whole capture rolls back.
- The MultipleInstanceManager pattern enables per-tenant multi-provider fan-out
  (e.g. Stripe for US customers + Adyen for EU customers) without a bespoke
  registry — each config is a first-class instance name.
- The 6 providers are FIRST-CLASS driver classes with `#[AsPaymentProvider]` —
  new providers ship as new driver classes + JSON schemas + webhook handlers. No
  reflection-based extension.
- The payment intent state machine enforces one-way transitions via
  PaymentIntentObserver.updating. State refuses to go backward (a succeeded
  intent cannot revert to requires_payment_method).
- 3DS2 handling is a first-class concern — the `next_action_type` +
  `next_action_url` + `next_action_data` fields carry the customer through the
  challenge flow via the provider SDK.
- PaymentMethod deduplication via fingerprint_hash (SHA-256 of provider
  fingerprint) prevents storing the same card multiple times per customer.
  Attempting to attach a duplicate re-activates the existing PaymentMethod
  instead.
- Webhook idempotency via provider_event_id — the same webhook fired twice
  creates zero duplicates.
- Dispute evidence submission is bounded by `evidence_due_by`
  (provider-communicated deadline). NotifyDisputeEvidenceDueJob fires 3 days
  before to alert admins.

### Compliance

- **PCI-DSS Level 1** — no card PAN/CVV/magnetic-stripe/PIN storage. Only
  provider-scoped tokens. Customer confirms via provider SDK client-side
  (PCI-DSS scope reduction).
- **PSD2 (EU) + SCA** — 3DS2 gate on card transactions above the SCA threshold
  (typically €30).
- **3DS2 (EMVCo)** — payment_intents lifecycle handles authentication step-up.
- **GDPR Art. 6(1)(b)** — contractual basis for payment processing (no consent
  required).
- **GDPR Art. 15** — customer can request their payment history + saved payment
  method summaries via the compliance module.
- **GDPR Art. 17** — TenantErased cascades hard-delete except immutable
  financial records → archived per Art. 17 §3 exception. UserErased soft-deletes
  payment methods + nulls subject_id on payments (immutable financial rows
  survive).
- **AML** — payment records retained + submitted per regulator when requested
  (7y baseline; 10y Enterprise).
- **CCPA §1798.135** — customer can request payment method deletion + Do Not
  Sell honoured on marketing dispatches.
- **SOX §404** — every state transition on payments / payment_intents /
  payment_disputes emits an audit row with 7-year retention.
- **State-specific US regulations** — some states require in-state payment
  processing routing; enforced by tenant configuration of per-region provider
  preferences.
