# refund

Refund orchestration + provider-side dispatch + credit-note issuance +
double-entry offset + clawback fan-out. Wave 4 finance infrastructure. The
money-out counterpart to the `payment` module (money-in). Refund answers "has
this payment been reversed, in full or in part, and what side effects did the
reversal produce?".

## 1. What this module owns

| Concern                                  | Owned artefact                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Refund root record                       | `Refund` — one row per refund initiation. IMMUTABLE after status=succeeded. Cancellable ONLY while status=pending. 7y retention.     |
| Per-line partial refund                  | `RefundLine` — supports partial refunds where only some invoice lines are reversed. Freezes proration_config for period refunds.     |
| Approval workflow                        | `RefundApprovalManager` — determines requires_approval per threshold (amount + days_since_payment) + dispatches approval notifications. |
| Provider-side dispatch                   | `RefundProviderExecutor` — thin façade over `payment::PaymentProviderManager` that resolves the correct driver + calls createRefund. |
| Async status polling                     | `CheckRefundProviderStatusJob` — some providers take 5-10 days to fully process card refunds. Polls until terminal.                  |
| Proration for cancelled memberships      | `ProrationCalculator` — computes refund_amount from unused_period × pass_credit; freezes proration_config on the refund_line.        |
| Credit-note issuance                     | `CreditNoteIssuer` (from `invoice` module) — creates a reversal invoice. Called in the same transaction as refund succeeded.         |
| Double-entry offset                      | `TransactionRecorder` (from `transaction` module) — debit refunds_owed, credit cash. Called in the same transaction.                 |
| Downstream clawback fan-out              | `ClawbackCoordinator` — fires marketing::RefundIssued (negative-value conversion) + referrals::ClawbackReward + coupon::ClawbackRedemption. |
| Refund number generator                  | `RefundNumberGenerator` — sequential per tenant per year (`REF-2026-00000001`). Distinct from ULID row IDs.                          |

### 1.1 The two owned tables

- `refunds` — root record for a refund initiation. Belongs to `Tenant`. References `Payment` (RESTRICT) + `Invoice` (RESTRICT) + `CreditNote` (RESTRICT, nullable — populated on succeeded) + `Transaction` (RESTRICT, nullable — populated on succeeded). 7y retention (10y Enterprise). IMMUTABLE after status=succeeded (RefundObserver refuses mutation).
- `refund_lines` — per-invoice-line refund detail. Belongs to `Tenant` + `Refund` + `InvoiceLine`. Composite unique on `(tenant_id, refund_id, invoice_line_id)` — one refund cannot double-refund the same invoice line. Freezes `proration_config` for period-based refunds.

Neither table carries `application_id`, `region_id`, `organization_id`, `branch_id`, or `scope_node_id`. All cascade through `tenant_id` per tenancy-columns.md §3 with the forbidden columns of §5 explicitly absent. Enforced by the tenancy-compliance-auditor.

## 2. Where this module sits in the finance lanes

Refund sits at priority 58 — after invoice (54) + transaction (55) + payment (56) + coupon (51/refund cascades), before chargeback (60). The dependency shape is deliberate:

```
invoice (54)    — WHAT the customer owes
   ↓
transaction (55) — DOUBLE-ENTRY LEDGER movement (records the money-in AND records this module's offset money-out)
   ↓
payment (56)    — WHO / WHEN / HOW money moved IN for a specific invoice
   ↓
refund (58)    — reversing part or all of a specific payment (THIS MODULE)
   ↓
chargeback (60) — customer-initiated forceful reversal via their bank
```

Distinct from:

- **Payment** — a money-in event. This module references its parent payment via `payment_id` (RESTRICT). Refund is money-out — the complementary event.
- **CreditNote** — the reversal-invoice document. Owned by `invoice` module. Every succeeded refund creates a credit note via `CreditNoteIssuer` in the same transaction. Refund carries `credit_note_id` (nullable until succeeded).
- **Transaction** — a double-entry ledger movement. Every succeeded refund records an offsetting transaction (debit refunds_owed, credit cash) via `TransactionRecorder`. Refund carries `transaction_id` (nullable until succeeded).
- **Chargeback** — a customer-initiated forceful reversal via their bank (payment network dispute, not merchant-initiated). Owned by `chargeback` module. A refund is merchant-initiated; a chargeback is customer-forced.

## 3. Refund reasons — the 10 canonical values

The `refund_reason` enum answers "why is this money being returned?". Every refund carries exactly one reason for audit + downstream event routing:

| Reason                    | Trigger                                                                                                                        | Consumer-visible? | Approval by default? |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------------------- |
| `customer_requested`      | Customer explicitly asked (via POST /refunds/mine).                                                                            | Yes               | Amount / age-based   |
| `product_not_received`    | Service not rendered (missed class, cancelled event).                                                                          | Yes               | Amount / age-based   |
| `product_unacceptable`    | Service rendered but quality issue (equipment failure, coach absence).                                                         | Yes               | Amount / age-based   |
| `duplicate_charge`        | Provider or ops caught a duplicate capture. Automatic full refund.                                                             | Yes               | No (system-initiated) |
| `fraud_confirmed`         | Fraud team confirmed the card was stolen.                                                                                      | No                | Yes (fraud lead)     |
| `subscription_cancelled`  | Membership cancelled mid-period → prorated refund of unused time.                                                              | Yes               | Amount / age-based   |
| `admin_correction`        | Ops caught a billing error (wrong plan applied, coupon should have been honoured).                                             | Yes               | Yes (finance lead)   |
| `chargeback_prevention`   | Customer threatened chargeback; ops issues refund proactively to avoid provider fees + network scrutiny.                       | Yes               | Yes (finance lead)   |
| `regulator_required`      | Data protection authority / consumer protection agency directive (e.g. cooling-off period breach, deceptive practices ruling). | No                | Yes (legal)          |
| `accounting_correction`   | Finance team caught a downstream accounting error requiring reversal.                                                          | No                | Yes (finance lead)   |

## 4. The three refund_type shapes

`refund_type` answers "how much of the original payment is being reversed?":

- **`full`** — entire `payment.amount_cents` (minus any previously refunded amount). Simplest path. No `refund_lines` needed — the refund line array can be empty. The parent invoice transitions to `status='refunded'`.
- **`partial`** — a specific amount below the full payment. Requires at least one `RefundLine` row identifying which invoice lines are being reversed. The parent invoice transitions to `status='partially_refunded'` and `amount_refunded_cents` accumulates.
- **`prorated`** — special case of partial for cancelled memberships. Requires exactly one `RefundLine` with a populated `proration_config` JSONB blob. `ProrationCalculator` computes the refund amount from the unused period × per-day cost, minus any carried-over pass credit.

Every refund_line's `amount_cents` sums MUST equal the parent refund's `amount_cents` (observer-enforced). Refund_lines cannot double-refund an already-refunded invoice line — the composite unique `(tenant_id, refund_id, invoice_line_id)` blocks it AND the observer refuses on the second attempt.

## 5. The refund state machine

Refund status transitions are one-way (no backwards moves) except the cancel path:

```
                                    │
                POST /refunds       │
                                    ▼
                (RefundObserver.creating: determine requires_approval)
                                    │
                          ┌─────────┴─────────┐
                          │                   │
              requires_approval=true    requires_approval=false
                          │                   │
                          ▼                   ▼
                  awaiting_approval        approved
                          │                   │
        ┌─────────────────┼─────────────┐     │
        │                 │             │     │
    approve            reject         cancel  │
        │                 │             │     │
        ▼                 ▼             ▼     ▼
    approved           rejected     cancelled processing
                                              │
                                              ▼ (async — provider dispatch)
                                       ┌──────┴──────┐
                                       │             │
                                    (poll)         (fail)
                                       │             │
                                       ▼             ▼
                                    succeeded      failed / provider_error

Legend:
  pending          — same as awaiting_approval (nominal alias for early stage)
  awaiting_approval — needs approval; approver review pending
  approved         — approved (either auto or by approver); ready to dispatch
  processing       — provider async processing (some providers 5-10 days)
  succeeded        — provider confirmed; credit note + transaction created; IMMUTABLE
  failed           — provider rejected non-recoverable (customer chargeback route);
                     invoice + payment untouched
  cancelled        — cancelled while awaiting_approval or approved (not yet dispatched)
  rejected         — approver rejected; no provider dispatch
  provider_error   — provider returned non-terminal error; retryable via force-fail
                     or ReconcileRefundsJob
```

Cancel is the ONLY reversal path. Once status=succeeded, `RefundObserver.updating` refuses ALL state changes — refunds are IMMUTABLE. Corrections require creating a new refund (with reason='accounting_correction') that re-issues the money back to the customer.

`RefundObserver.updating` enforces every one-way transition. Two P1 signals:

- Attempted transition from `succeeded` → anything: `REFUND_IMMUTABLE`.
- Attempted transition skipping states (e.g. `awaiting_approval` → `succeeded`): `REFUND_INVALID_STATE_TRANSITION`.

## 6. Approval workflow

Two thresholds trigger the `requires_approval` flag:

1. **Amount threshold** — `refund.approval.threshold_amount_cents` (default 10000 cents = $100). Any refund above this amount requires approval.
2. **Staleness threshold** — `refund.approval.threshold_days_since_payment` (default 30 days). Any refund initiated more than N days after the original payment requires approval.

Either threshold trips → `requires_approval=true`. Refunds with reasons in the always-approve set (`fraud_confirmed`, `admin_correction`, `chargeback_prevention`, `regulator_required`, `accounting_correction`) ALWAYS require approval regardless of thresholds. Refunds with reason `duplicate_charge` NEVER require approval (system-initiated).

`RefundApprovalManager` dispatches `NotifyRefundApprovalRequiredJob` to every user holding `refunds.approve` permission. The notification carries a signed magic link into the approve/reject UI. Approvers must record `rejection_reason` when rejecting; approvals capture only `approved_by_user_id` + `approved_at`.

Approval is a policy-gated action — no self-approval (`RefundPolicy::approve` refuses when `refund.initiated_by_user_id === $actor->id`). Enforces segregation of duties per SOX §404.

## 7. Provider-side dispatch

Refund dispatch flows through `payment::PaymentProviderManager` — this module does NOT own driver code. `RefundProviderExecutor` is a thin façade:

1. Loads the original `Payment` row.
2. Resolves the provider driver via `paymentProviderManager.instance(payment.provider_instance_name)`.
3. Calls the driver's `createRefund($payment->provider_reference_id, $refund->amount_cents, $refund->reason)`.
4. Persists the returned `provider_reference_id` + `provider_fee_reversal_cents` on the refund row.

Provider-side response is asynchronous — many providers accept the refund request immediately (returning HTTP 202) but take 5-10 days to actually move the money for card refunds. `CheckRefundProviderStatusJob` polls per provider on a per-provider cadence (Stripe: hourly; Paddle: 4h; Adyen: hourly; Square: 4h; PayPal: hourly; CustomWebhook: caller-configured).

Terminal outcomes:

- **succeeded** — provider reported the refund fully processed. RefundObserver.updating fires the finalization chain (credit note + transaction + clawback fan-out).
- **failed** — provider rejected non-recoverably (e.g. original charge already refunded, provider account closed). Status → `failed` + `failure_reason` populated. Customer + admin notified. Payment untouched.
- **provider_error** — non-terminal error (network timeout, transient provider outage). Retried via `ReconcileRefundsJob` or admin `force-fail` after manual investigation.

Provider webhook events (async success/failure notifications) route through the `payment` module's `payment.webhook_verify` middleware + dispatch a `RefundProviderReconciled` event. This module's listener catches that event + transitions the refund to succeeded/failed accordingly.

## 8. Every succeeded refund triggers five side effects

`RefundObserver.updating` (fires only after the row commits transition to `status=succeeded` — `ShouldDispatchAfterCommit`):

1. **`TransactionRecorder::recordOffset($refund)`** — double-entry ledger:
   - Debit: `refunds_owed` account (money going out)
   - Credit: `cash` account (bank balance decreases)
2. **`CreditNoteIssuer::createFromRefund($refund)`** — issues a reversal invoice via the invoice module. Persists `credit_note_id` back onto the refund row.
3. **`InvoiceStateUpdater::applyRefund($refund)`** — state update on the parent invoice:
   - Full amount → `invoices.status = 'refunded'` + `refunded_at = refund.processed_at`
   - Partial → `invoices.status = 'partially_refunded'` + `invoices.amount_refunded_cents += refund.amount_cents`
   - `payments.amount_refunded_cents += refund.amount_cents` (never exceeds `payment.amount_cents`)
4. **`ClawbackCoordinator::fanOut($refund)`** — dispatches domain events:
   - `RefundClawbackReferral` → cascades to `referrals` module (reverse any materialized referral reward tied to the refunded invoice).
   - `RefundClawbackCoupon` → cascades to `coupon` module (reverse any redeemed coupon tied to the refunded invoice).
5. **`marketing::RefundIssued`** — via `FireMarketingRefundIssuedOnRefundSucceeded` hook:
   - Fires domain event `finance.refund_issued`
   - Growth module captures + fans out to ad networks with negative-value conversion (ad networks subtract the refund_amount from ROAS + retrain fraud models)

All five run in the same DB transaction as the status update — a Refund row NEVER exists in `status=succeeded` without its transaction record + credit note + invoice state update. If any of the five fails, the whole succeed rollback (transient) OR the refund transitions to `provider_error` for manual investigation (persistent failure).

## 9. Refunded-to targets

`refunded_to` on the refund row captures the destination for the money:

- **`original_payment_method`** — provider-side refund back to the same card / bank account / wallet used for the original payment. Default. Preferred for compliance (matches the payment method for AML trail).
- **`customer_balance`** — credit to a store balance on the tenant's system. Used when the original method is no longer available (card cancelled, wallet closed). Never touches the provider. Reflected as a tenant-owed IOU.
- **`bank_transfer`** — manual ACH / wire transfer initiated by finance. Used for high-value refunds where the provider path fails or isn't cost-effective. Records the target bank details in `metadata.bank_transfer_details` (encrypted at rest via TokenEncryptor from payment module).
- **`check`** — physical check mailed to the customer address on file. Rare — used when other rails aren't viable (customer requests, small tenants without bank rails).

Non-provider paths (customer_balance / bank_transfer / check) skip the `InitiateProviderRefundJob` step — the refund status transitions directly from `approved` → `processing` → `succeeded` after admin confirmation. Provider paths always dispatch through the async provider chain.

## 10. Proration for cancelled memberships

The most complex refund shape. When a Membership is cancelled mid-period:

```
Payment was:            $60 for 30 days of unlimited access
Cancellation at day:    12
Unused period:          18 days
Total period days:      30
Unused period ratio:    18/30 = 0.6
Refund amount:          $60 × 0.6 = $36

Adjustments:
- Any Pass records used during the paid period → deducted from refund
- Any carry-over passes into next period → credited back to customer (added to refund)
```

`ProrationCalculator::compute($membership, $cancellation_date)` returns:

```json
{
  "refund_amount_cents": 3600,
  "unused_period_start": "2026-04-13T00:00:00Z",
  "unused_period_end": "2026-05-01T00:00:00Z",
  "total_period_days": 30,
  "unused_days": 18,
  "unused_pass_count": 0,
  "unused_pass_credit_cents": 0
}
```

This blob is FROZEN into the `refund_line.proration_config` at creation time. Later changes to the membership plan pricing NEVER retroactively adjust the refund amount.

The formula catalog (per plan.billing_interval — daily / weekly / monthly / annual / one-time) lives at `data/proration-formula-catalog.json`. Different intervals have different day-count conventions (calendar days vs 30-day months vs 365-day years).

## 11. Downstream clawback fan-out

Every succeeded refund fires two clawback events for cross-module reversal:

### 11.1 `RefundClawbackReferral`

Fires when the refunded invoice was linked to a materialized `ReferralReward` (referrals module, Wave 5). Payload:

- `refund_id`
- `invoice_id`
- `referral_reward_id`
- `reward_type` (`percent_discount` / `fixed_amount` / `credit`)
- `reward_amount_cents`

The referrals module reverses the reward:
- Vested rewards → return to `pending_reversal` state, then `reversed`.
- Materialized coupon rewards → reverse the redemption via the coupon module (fires `CouponClawbackCompleted` on the coupon side).
- Cash-credit rewards → offset transaction + notify the referrer.

### 11.2 `RefundClawbackCoupon`

Fires when the refunded invoice had a redeemed coupon. Payload:

- `refund_id`
- `invoice_id`
- `coupon_redemption_id`
- `coupon_id`

The coupon module handles via `ProcessCouponClawbackJob` — sets `reversed_at` on the redemption + decrements `coupon.usage_count`. See `coupon` module for full mechanics.

## 12. Marketing negative-value conversion

Every succeeded refund fires `marketing::RefundIssued` (Wave 5 bridge). Ad networks use this to:

1. **Subtract from ROAS** — the refund_amount is deducted from the ad campaign's revenue attribution.
2. **Retrain fraud models** — refunds correlated with specific ad clicks feed into the provider's fraud detection.
3. **Adjust bidding** — some networks reduce bidding on customer segments with high refund rates.

Payload includes the original conversion's ad_network + campaign_id (looked up via the payment's linked marketing_event) so the ad network can attribute the reversal to the correct conversion.

Consent-gate: `advertising` tier. Customers who have withdrawn advertising consent have their refunds suppressed at dispatch. Refund still succeeds; only the marketing lane skips.

## 13. Tier gating

- **Small** — `refund_capture` on. `refund_customer_self_service` on (POST /refunds allowed for customers). Refund types: full ONLY (no partial, no prorated). `refund_approval_workflow` on (default). 7y retention.
- **Medium** — Adds `refund_partial` (partial refunds + refund_lines editor). `refund_prorated` (prorated refunds for cancelled memberships). `refund_multi_currency` (cross-currency refunds when payment.currency differs from tenant default).
- **Enterprise** — Adds `refund_extended_retention` (7y → 10y for regulated tenants). `refund_bulk_processing` (bulk-refund CLI + admin bulk-issue UI for scenarios like class cancellation refunding 50+ athletes at once).

Enforced by `refund_capture` (master gate — refunds refuse when off) + `refund_customer_self_service` (customer POST route) + `refund_partial` (refund_type=partial permission) + `refund_prorated` (refund_type=prorated permission) + `refund_multi_currency` (cross-currency refunds) + `refund_approval_workflow` (approval flow — default on) + `refund_extended_retention` (10y) + `refund_bulk_processing` (bulk endpoints).

## 14. Compliance

- **PCI-DSS** — refund uses payment token from the original payment; never accesses card PAN / CVV.
- **SOX §404** — audit trail on every state transition (Auditable trait, 7y retention). Segregation of duties enforced (approver ≠ initiator).
- **Consumer protection laws** (varies by state / province) — refund SLA compliance:
  - California CCPA §1798.100 — 14-30 day refund windows for certain purchases.
  - EU Consumer Rights Directive 2011/83/EU — 14-day cooling-off period.
  - UK Consumer Rights Act 2015 — reasonable time refund windows.
  Configured per-tenant via `settings.retention_years` + region-specific reasoning documented in the audit log.
- **GDPR Art. 6(1)(b)** — contractual basis for refund processing (no separate consent required).
- **GDPR Art. 15** — customer can request their refund history export via /refunds/mine.
- **GDPR Art. 17** — TenantErased cascades hard-delete except financial records → archived to compliance_archive per Art. 17 §3 exception.
- **VAT / Sales Tax** — refunds reduce output VAT. Credit note (issued by CreditNoteIssuer) satisfies regulator; the transaction module's ledger captures the tax reversal separately.
- **AML** — refund records retained + submitted per regulator when requested (7y baseline; 10y Enterprise).
- **CCPA** — customer can request refund history deletion (soft-delete + 90-day archive to compliance_archive; historical Refund rows survive per financial retention).
- **WCAG 2.2 AA** — refund approve/reject UI + refund status chip meet AA contrast + keyboard navigation.

## 15. Retention

- `refunds` — 7 years post-`processed_at` (SOX + tax audit). 10 years Enterprise `refund_extended_retention`.
- `refund_lines` — co-terminous with parent refund (FK CASCADE).
- `refund_lines.proration_config` — co-terminous with parent refund line (JSONB column).
- `TenantErased` — FK CASCADE hard-deletes non-invoice-linked refunds. Invoice-linked refunds migrate to `compliance_archive.refunds` + `compliance_archive.refund_lines` prior to cascade (financial-obligation retention). Audit rows outlive the source rows.

## 16. What this module does NOT do

- **No cash / check refunds via provider path.** v1 electronic refunds only via provider. `refunded_to='check'` marks the refund as issued outside the provider flow; the physical mailing is a manual finance-team task tracked in `metadata.check_details`.
- **No refund without original payment reference.** Every refund carries `payment_id` (RESTRICT FK). Orphan refunds are refused — corrections happen via credit notes on the invoice (invoice module).
- **No mutation of Refund rows after status=succeeded.** Refunds are IMMUTABLE. Corrections require a NEW refund with reason='accounting_correction' issuing the money BACK to the customer, OR a chargeback (chargeback module) if the original refund was in error.
- **No `application_id` / `region_id` / `organization_id` / `branch_id` / `scope_node_id` on any owned row.** All cascade through `tenant_id`. Enforced by tenancy-compliance-auditor.
- **No cross-tenant refunds.** Refunds are tenant-scoped. A refund on tenant A cannot reference a payment on tenant B.
- **No provider-agnostic refund status polling.** Each provider has its own reconciliation cadence (Stripe: hourly, Paddle: 4h, etc.). `CheckRefundProviderStatusJob` schedules per-provider.
- **No refund-of-a-refund.** Once a refund succeeds, further reversal happens via a NEW payment (customer paying again for the same service, tracked separately) or a chargeback claim.
- **No fraud detection ML on refunds.** Delegated to fraud team review + `fraud_confirmed` reason flag. Automated rules (velocity, unusual amounts) live in the payment module's fraud checker at capture time.
- **No public POST /refunds/{code}/preview.** Refund amount + proration are computed inside the refund creation flow — there's no "hypothetical refund" endpoint. The customer-facing refund UI shows the maximum refundable amount inline (via GET /payments/{payment}/refundable-amount from the payment module).

## 17. Cross-references

- `hierarchy.md` §1b + §7 — finance module vocabulary + tier matrix.
- `tenancy-columns.md` §3 + §5 — refund tables carry `tenant_id`; NEVER `application_id` / `region_id` / `organization_id` / `branch_id` / `scope_node_id`.
- `growth-and-observability.md` — refund.issued fires marketing::RefundIssued (negative-value conversion) + referrals::ClawbackReward.
- `modules/finance/blueprints/payment/` — the parent record for every refund. RefundProviderExecutor delegates to PaymentProviderManager.
- `modules/finance/blueprints/invoice/` — CreditNoteIssuer lives here; every succeeded refund creates a credit note.
- `modules/finance/blueprints/transaction/` — TransactionRecorder lives here; every succeeded refund records an offsetting ledger movement.
- `modules/finance/blueprints/coupon/` — coupon clawback cascade target. RefundSucceeded fires `RefundClawbackCoupon`.
- `modules/finance/blueprints/membership/` — ProrationCalculator reads membership billing_interval + paid_through + carried-over passes.

## 18. ULID prefixes owned

- `rfd_` (Refund) — new.
- `rfl_` (RefundLine) — new.

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

**Never confuse with:**

- `pay_` (Payment), `ivc_` (Invoice), `crn_` (CreditNote), `trx_` (Transaction), `cbk_` (Chargeback).
- `ten_` (Tenant), `usr_` (User), `mbr_` (Membership).

Consumed (referenced via FK): `ten_`, `usr_`, `pay_`, `ivc_`, `crn_`, `trx_`, `mbr_`, `iln_` (invoice_line), `cpn_` (coupon — cascaded), `crd_` (coupon_redemption — cascaded), `rrw_` (referral_reward — cascaded).
