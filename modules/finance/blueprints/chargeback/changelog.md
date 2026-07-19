# chargeback — changelog

## [Unreleased] — inception (Wave 4)

- Chargeback module authored. Two owned entities:
  - `Chargeback` — root record for a bank-forced payment reversal.
    IMMUTABLE after terminal status (won / lost / expired /
    accepted_refund). 7y retention (10y Enterprise). Carries payment_id +
    invoice_id + payment_dispute_id (when escalated) + transaction_id
    (loss offset) + fee_transaction_id (network fee) + refund_id (RDR
    path) + network + reason_code + reason_category + amount + fee +
    provider_reference_id.
  - `ChargebackEvidence` — per-submission evidence bundle. Composite
    unique on (tenant_id, chargeback_id, submission_attempt_number).
    IMMUTABLE at creation (append-only audit). Multiple submission
    attempts supported when bank requests additional evidence (CE3.0
    second pass).
- Seven entitlement gates:
  - `chargeback_management` (all tiers) — master gate.
  - `chargeback_evidence_submission` (all tiers, default on) — evidence
    workflow.
  - `chargeback_rdr` (Medium+) — Rapid Dispute Resolution auto-refund
    (Visa-only).
  - `chargeback_ce3` (Medium+) — Compelling Evidence 3.0 evidence
    builder (Visa-only).
  - `chargeback_rate_monitoring` (all tiers, default on) — rate tracker +
    VDMP/MDMP alerts.
  - `chargeback_extended_retention` (Enterprise) — 7y -> 10y.
  - `chargeback_advanced_reporting` (Medium+) — rich rate + reason +
    provider distribution reports.
- State machine (one-way): pending_evidence -> evidence_submitted ->
  under_bank_review -> won / lost. Alternate paths: pending_evidence ->
  accepted_refund (RDR); pending_evidence -> expired (missed deadline,
  auto-loss); evidence_submitted -> pending_evidence (bank requested
  additional evidence, CE3.0 second pass). Won / lost / expired /
  accepted_refund are terminal + IMMUTABLE.
- Card network reason code catalogue (40+ codes across 8 networks):
  Visa (10.4 / 10.5 / 11.1-11.3 / 12.1-12.7 / 13.1-13.9), Mastercard
  (4837 / 4863 / 4870 / 4834 / 4841 / 4842 / 4853 / 4855), Amex (F14 /
  F24 / F29 / P01 / P05), Discover (4842 / 4855), JCB / UnionPay /
  Diners. Reason categories: fraud / authorization / processing_errors
  / consumer_disputes / card_recovery.
- Provider webhook path: payment::PaymentWebhookHandler verifies
  signature + dispatches ChargebackWebhookReceived → HandleChargebackWebhook
  → ChargebackOrchestrator::createFromWebhook / reconcileFromWebhook.
  Six providers day-1: Stripe, Paddle, Adyen, Square, PayPal,
  CustomWebhook. Per-provider polling cadence (Stripe hourly / Adyen
  hourly / Paddle 4h / Square 4h / PayPal hourly).
- Finalization chain for LOST/EXPIRED (all 5 steps run in one DB txn):
  (1) TransactionRecorder::recordChargebackLoss (double-entry debit
  chargebacks_expense, credit cash for disputed amount), (2)
  NetworkFeeCalculator::compute + TransactionRecorder::recordChargebackFee
  (secondary offsetting Transaction for network fee $15-25),
  (3) InvoiceStateUpdater::markDisputed (invoice.status='disputed' +
  payment.amount_disputed_cents + CreditNoteIssuer for tax reversal),
  (4) ClawbackCoordinator::fanOut (ChargebackClawbackReferral +
  ChargebackClawbackCoupon), (5) marketing::ChargebackFiled (negative-value
  conversion + FRAUD SIGNAL — heavier weight than refunds on ad-network
  fraud model retraining).
- WON chargebacks: reduce payment.amount_disputed_cents back (money
  returned) + fire ChargebackWon. NOTE: won chargebacks still incur the
  initial network fee — banks don't refund the fee they collected.
- RDR path (Visa-only, Medium+): admin clicks POST
  /chargebacks/{chargeback}/accept → RdrHandler creates a Refund via
  refund::RefundOrchestrator with reason='chargeback_prevention' →
  RefundSucceeded transitions chargeback to accepted_refund (terminal).
  Cheapest defense — no network fee, no rate impact.
- CE3.0 (Visa-only, fraud-reason-only, Medium+): Ce3EvidenceBuilder
  assembles two prior legitimate purchases + matching IP + device
  fingerprint alongside standard evidence. Dramatically higher win rates
  for eligible fraud chargebacks (70-85% vs 15-25% baseline).
- Downstream clawback fan-out: `ChargebackClawbackReferral` cascades to
  `growth::referrals` for materialized reward reversal;
  `ChargebackClawbackCoupon` cascades to `coupon` module for redemption
  reversal + `coupon.usage_count` decrement (clawback_reason='chargeback').
- Marketing negative-value + fraud signal: every ChargebackLost fires
  `marketing::ChargebackFiled` (Wave 5 bridge). Distinct from refund's
  negative-value conversion in TWO ways — (1) chargebacks feed fraud
  models MORE aggressively than refunds, (2) reason_category
  distinguishes fraud-labeled (aggressive fraud model retraining) from
  consumer_disputes-labeled (product-quality signal). Consent-gate
  `advertising`.
- Rate monitoring: `ChargebackRateCalculator` computes rolling 60-day
  rate per network via MonitorChargebackRateJob nightly. Thresholds:
  0.9% Visa VDMP / 1.5% Mastercard MDMP / 1.0% Amex Enhanced Dispute /
  1.0% Discover MDP. Fires ChargebackRateThresholdExceeded (P1) when
  crossed. Actionable — merchant-account termination risk if sustained.
- Chargeback number generator: sequential per tenant per year
  (`CBK-2026-00000001`). DB-backed counter (cbk:sequence:{tenant}:{year}
  cache).
- 3 real-time broadcast channels: `tenant.{id}.chargebacks`,
  `tenant.{id}.chargebacks.pending-evidence`,
  `tenant.{id}.chargebacks.rate-alerts`.
- No customer-facing routes — chargebacks are admin-only surface (card
  network rules prohibit surfacing chargeback state to customers on
  most networks).
- 9 background jobs + 16 events + 2 observers + 2 policies + 11 commands
  + 2 middleware + 11 bindings.
- 4 SDUI resources (chargeback, chargeback-evidence,
  chargeback-pending-evidence, chargeback-rate-report) + widgets
  (chargeback-status-chip, network-badge, reason-code-picker,
  evidence-completeness-indicator).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`,
  `entitlements`, `compliance`, `invoice`, `membership`, `payment`,
  `transaction`, `refund`.
- Extended by `growth::marketing` (Wave 5 — ChargebackLost fires
  negative-value + fraud signal conversion), `growth::referrals`
  (Wave 5 — ChargebackClawbackReferral cascades reward reversal).
- Wave 4 inception release.

### Design notes

- No row carries `application_id` / `region_id` / `organization_id` /
  `branch_id` / `scope_node_id`. All cascade through `tenant_id`.
  Enforced by tenancy-compliance-auditor.
- Composite unique on `chargebacks` (tenant_id, chargeback_number).
- Composite unique on `chargeback_evidence` (tenant_id, chargeback_id,
  submission_attempt_number) — prevents duplicate submission attempts +
  enforces monotonic attempt numbering.
- Cross-chargeback invariant (SUM of amount_cents across non-terminal-
  won chargebacks for a payment <= payment.amount_cents -
  payment.amount_refunded_cents) enforced at observer level via SELECT
  ... FOR UPDATE on parent payment.
- Chargebacks are IMMUTABLE post-terminal. Corrections require ops
  investigation + optionally a manual reversal transaction in the
  transaction module.
- PCI-DSS Req 3.4 compliance: evidence submission observer SCANS
  evidence bodies for PAN patterns (13-19 digit card BIN prefixes) +
  refuses. Only tokens + last-4 + BIN permitted in evidence bundles.
- Card network rules integration: VDMP/MDMP monitoring via
  MonitorChargebackRateJob nightly + ChargebackRateThresholdExceeded
  event + platform-plane rate-threshold-alerts endpoint for Academorix
  ops cross-tenant risk monitoring.
- ULID prefixes `cbk_` (Chargeback) + `cev_` (ChargebackEvidence) are
  new + distinct from `pay_` (Payment), `pdi_` (PaymentDispute), `rfd_`
  (Refund), `ivc_` (Invoice), `trx_` (Transaction), `crn_` (CreditNote)
  to avoid cross-module confusion.
- Wave 4 is the initial finance-tier release for chargebacks. Wave 5+
  may add: ML-based chargeback prevention (analyze payment features vs
  known-fraud patterns), Mastercard DR2 support (equivalent to Visa
  RDR), pre-chargeback deflection (Ethoca / Verifi integration for
  early customer notification before formal chargeback).
