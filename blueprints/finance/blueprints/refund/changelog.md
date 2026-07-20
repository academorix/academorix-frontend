# refund — changelog

## [Unreleased] — inception (Wave 4)

- Refund module authored. Two owned entities:
  - `Refund` — root record for a refund initiation. IMMUTABLE after
    status=succeeded. Cancellable ONLY while status=pending. 7y retention.
    Carries payment_id + invoice_id + credit_note_id (populated on
    succeeded) + transaction_id (populated on succeeded) + reason + amount
    + provider result.
  - `RefundLine` — per-invoice-line refund detail. Supports partial +
    prorated refunds. Freezes `proration_config` for period-based
    refunds. Composite unique on (tenant_id, refund_id, invoice_line_id).
- Eight entitlement gates:
  - `refund_capture` (all tiers) — master feature gate.
  - `refund_customer_self_service` (all tiers) — POST /refunds/mine
    permitted.
  - `refund_partial` (Medium+) — partial refunds + refund_lines.
  - `refund_prorated` (Medium+) — prorated refunds for cancelled
    memberships.
  - `refund_multi_currency` (Medium+) — cross-currency refunds.
  - `refund_approval_workflow` (all tiers, default on) — approval
    workflow.
  - `refund_extended_retention` (Enterprise) — 7y -> 10y.
  - `refund_bulk_processing` (Enterprise) — bulk-refund CLI + admin
    bulk-issue UI.
- Ten canonical refund reasons: `customer_requested`,
  `product_not_received`, `product_unacceptable`, `duplicate_charge`,
  `fraud_confirmed`, `subscription_cancelled`, `admin_correction`,
  `chargeback_prevention`, `regulator_required`, `accounting_correction`.
- Three refund_type shapes: `full`, `partial`, `prorated`.
- Four refunded_to targets: `original_payment_method` (default, provider
  path), `customer_balance` (store credit), `bank_transfer` (manual ACH /
  wire), `check` (physical mail).
- State machine (one-way except cancel): pending → awaiting_approval →
  approved → processing → succeeded (terminal). Cancel path from
  awaiting_approval / approved → cancelled. Reject path from
  awaiting_approval → rejected. Failure paths: processing → failed
  (terminal); processing → provider_error → processing (retry) OR failed
  (force-fail).
- Approval workflow: two thresholds (amount + staleness) determine
  requires_approval flag. Always-approve reasons (fraud_confirmed /
  admin_correction / chargeback_prevention / regulator_required /
  accounting_correction) force approval regardless. Auto-approve reason
  (duplicate_charge) forces requires_approval=false. Segregation of
  duties: approver ≠ initiator (SOX §404). Refuses self-approval with
  REFUND_SELF_APPROVAL_REFUSED.
- Provider-side dispatch: RefundProviderExecutor delegates to
  `payment::PaymentProviderManager`. Six providers day-1: Stripe,
  Paddle, Adyen, Square, PayPal, CustomWebhook. Async polling per-provider
  via CheckRefundProviderStatusJob (Stripe hourly / Paddle 4h / Adyen
  hourly / Square 4h / PayPal hourly).
- Finalization chain (all 5 steps run in one DB txn on succeeded
  transition): (1) TransactionRecorder::recordOffset (double-entry debit
  refunds_owed, credit cash), (2) CreditNoteIssuer::createFromRefund
  (reversal invoice), (3) InvoiceStateUpdater::applyRefund (invoice
  status update + amount_refunded_cents accumulation),
  (4) ClawbackCoordinator::fanOut (RefundClawbackReferral +
  RefundClawbackCoupon), (5) marketing::RefundIssued (negative-value
  conversion event).
- Downstream clawback fan-out: `RefundClawbackReferral` cascades to
  `growth::referrals` for materialized reward reversal;
  `RefundClawbackCoupon` cascades to `coupon` module for redemption
  reversal + `coupon.usage_count` decrement.
- Marketing negative-value conversion: every RefundSucceeded fires
  `marketing::RefundIssued` (Wave 5 bridge). Ad networks subtract from
  ROAS + retrain fraud models. Consent-gate `advertising`.
- Proration for cancelled memberships: `ProrationCalculator` computes
  refund from unused_period × per-day cost, minus used_pass_penalty +
  unused_pass_credit. `proration_config` frozen on refund_line at
  creation.
- Refund number generator: sequential per tenant per year
  (`REF-2026-00000001`). DB-backed counter (rfd:sequence:{tenant}:{year}
  cache).
- Customer-scope middleware: `refund.enforce_customer_scope` blocks
  cross-customer access on customer routes.
- 5 real-time broadcast channels: `tenant.{id}.refunds`,
  `tenant.{id}.refunds.pending-approvals`, `customer.{id}.refunds`.
- Provider webhook path (via payment module): PaymentWebhookReceived →
  HandleRefundWebhook listener → RefundReconciler::reconcileFromWebhook
  → state transition.
- 7 background jobs + 14 events + 2 observers + 2 policies + 11 commands +
  2 middleware + 10 bindings.
- 4 SDUI resources (refund, refund-line, refund-pending-approvals,
  refund-report) + 3 widgets (refund-status-chip, reason-picker,
  proration-preview).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`,
  `entitlements`, `compliance`, `invoice`, `membership`, `payment`,
  `transaction`.
- Extended by `chargeback` (Wave 4 sibling — chargeback resolution may
  create a Refund with reason='chargeback_prevention'), `growth::marketing`
  (Wave 5 — RefundSucceeded fires negative-value conversion),
  `growth::referrals` (Wave 5 — RefundClawbackReferral cascades reward
  reversal).
- Wave 4 inception release.

### Design notes

- No row carries `application_id` / `region_id` / `organization_id` /
  `branch_id` / `scope_node_id`. All cascade through `tenant_id`. Enforced
  by tenancy-compliance-auditor.
- Composite unique on `refunds` (tenant_id, refund_number).
- Composite unique on `refund_lines` (tenant_id, refund_id,
  invoice_line_id) — prevents double-refunding a single invoice line
  within one refund.
- Cross-refund invariant (SUM of amount_cents across non-terminal-failure
  refunds for a payment ≤ payment.amount_cents) enforced at observer
  level via SELECT ... FOR UPDATE on parent payment.
- Refunds are IMMUTABLE post-succeeded. Corrections require a NEW refund
  with reason='accounting_correction' issuing the money BACK.
- Segregation of duties enforced (approver ≠ initiator; force-fail
  restricted to admin+owner).
- ULID prefixes `rfd_` (Refund) + `rfl_` (RefundLine) are new + distinct
  from `pay_` (Payment), `ivc_` (Invoice), `crn_` (CreditNote), `trx_`
  (Transaction), `cbk_` (Chargeback) to avoid cross-module confusion.
- Wave 4 is the initial finance-tier release for refunds. Wave 5+ may
  add: bulk-refund UI polish, partial-line-reversal via SDUI editor,
  ML-based fraud detection on refund velocity, cross-tenant refund
  syndication (partnership programs).
