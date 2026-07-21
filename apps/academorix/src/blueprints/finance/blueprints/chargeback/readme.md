# chargeback

Chargeback lifecycle tracker + evidence submission + network fee recording +
offsetting transaction + clawback fan-out + rate monitoring. Wave 4 finance
infrastructure. The bank-forced money-out counterpart to the `payment` module
(money-in) and the `refund` module (merchant-initiated money-out). Chargeback
answers "has this payment been forcibly reversed by the customer via their bank,
and how are we defending against it?".

## 1. What this module owns

| Concern                         | Owned artefact                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Chargeback root record          | `Chargeback` — one row per chargeback filed by the cardholder's bank. IMMUTABLE after terminal status. 7y retention.                    |
| Per-attempt evidence submission | `ChargebackEvidence` — evidence bundle submitted to the acquiring bank per attempt. Multiple attempts supported; the last one wins.     |
| Evidence collection             | `EvidenceCollector` — auto-collects from invoice + membership + notifications + support tickets. Delegates to the owning modules.       |
| Evidence submission             | `EvidenceSubmitter` — dispatches evidence to the provider (Stripe / Adyen / etc.) via `payment::PaymentProviderManager`.                |
| Rate monitoring                 | `ChargebackRateCalculator` — computes tenant rolling 60-day chargeback rate; alerts >0.9% (Visa VDMP) / >1.5% (Mastercard MDMP).        |
| Network fee recording           | `NetworkFeeCalculator` — computes per-network fee ($15-25 typical) + records secondary offsetting Transaction on `lost`.                |
| Offsetting transaction          | `TransactionRecorder` (from `transaction` module) — debit chargebacks_expense, credit cash on `lost`. Called in the finalization chain. |
| Downstream clawback fan-out     | `ClawbackCoordinator` — on `lost` fires marketing::ChargebackFiled + referrals::ClawbackReward + coupon::ClawbackRedemption.            |
| Rapid Dispute Resolution (Visa) | `RdrHandler` — auto-refund path under RDR threshold; creates a Refund via `refund::RefundOrchestrator` + closes pre-chargeback state.   |
| Compelling Evidence 3.0 (Visa)  | `Ce3EvidenceBuilder` — assembles CE3.0-shape evidence (two prior legitimate purchases + matching IP + device fingerprint).              |
| Chargeback number generator     | `ChargebackNumberGenerator` — sequential per tenant per year (`CBK-2026-00000001`). Distinct from ULID row IDs.                         |

### 1.1 The two owned tables

- `chargebacks` — root record for a chargeback filed by the cardholder's bank.
  Belongs to `Tenant`. References `Payment` (RESTRICT) + `Invoice` (RESTRICT) +
  `PaymentDispute` (RESTRICT, nullable — set when escalated from a lost
  pre-chargeback dispute) + `Transaction` (RESTRICT, nullable — set once
  offsetting transaction recorded on `lost`) + `Transaction` (fee, RESTRICT,
  nullable — set for the network fee transaction on `lost`) + `Refund`
  (RESTRICT, nullable — set when RDR auto-refund path chosen). 7y retention (10y
  Enterprise). IMMUTABLE after terminal status (ChargebackObserver refuses
  mutation).
- `chargeback_evidence` — per-submission evidence bundle. Belongs to `Tenant` +
  `Chargeback`. Composite unique on
  `(tenant_id, chargeback_id, submission_attempt_number)` — a chargeback tracks
  multiple submission attempts when the bank requests additional evidence.
  Append-only. IMMUTABLE at creation (freeze all evidence fields on submit).

Neither table carries `application_id`, `region_id`, `organization_id`,
`branch_id`, or `scope_node_id`. All cascade through `tenant_id` per
tenancy-columns.md §3 with the forbidden columns of §5 explicitly absent.
Enforced by the tenancy-compliance-auditor.

## 2. Where this module sits in the finance lanes

Chargeback sits at priority 59 — after refund (58), immediately below the
finance-tier terminal aggregates. The dependency shape is deliberate:

```
invoice (54)    — WHAT the customer owes
   |
transaction (55) — DOUBLE-ENTRY LEDGER movement (records the money-in AND records this module's offsetting entries)
   |
payment (56)    — WHO / WHEN / HOW money moved IN for a specific invoice
   |
refund (58)    — merchant-initiated reversing part or all of a specific payment
   |
chargeback (59) — customer-initiated FORCEFUL reversal via their bank (THIS MODULE)
```

Distinct from:

- **Payment** — a money-in event. This module references its parent payment via
  `payment_id` (RESTRICT). Chargeback is bank-forced money-out.
- **Refund** — merchant-initiated money-out. Chargebacks escalate FROM
  PaymentDisputes (payment module) when the customer loses the pre-chargeback
  dispute. Under RDR, this module may CREATE a Refund (via
  refund::RefundOrchestrator) to auto-accept before the chargeback fully files.
- **PaymentDispute** (payment module) — the pre-chargeback state where the
  customer has notified their bank of intent to dispute, but the bank has not
  yet filed. When the tenant LOSES the pre-chargeback dispute (via
  `PaymentDisputeLost`), this module creates a Chargeback via
  `CreateChargebackFromDisputeJob`.
- **Transaction** — a double-entry ledger movement. Every LOST chargeback
  records TWO offsetting transactions via `TransactionRecorder`: one for the
  disputed amount (debit chargebacks_expense, credit cash) + one for the network
  fee (debit chargeback_fees, credit cash). Chargeback carries
  `transaction_id` + `fee_transaction_id` (both nullable until lost).

## 3. The chargeback state machine

Chargeback status transitions are one-way (no backwards moves except the retry
from `evidence_submitted` to `pending_evidence` when the bank requests
additional evidence):

```
                                       |
                 CreateChargebackFromDisputeJob     |     ChargebackWebhookReceived
                    (from PaymentDisputeLost)       |          (provider webhook)
                              |                     |                |
                              +---------------------+----------------+
                                                    |
                                                    v
                                       (ChargebackObserver.creating)
                                       (set status = pending_evidence)
                                       (compute evidence_due_by from bank)
                                       (dispatch CollectChargebackEvidenceJob)
                                       (fire ChargebackFiled + P0 notification)
                                                    |
                          +-------------------------+-------------------------+
                          |                         |                         |
                (submit evidence)          (accept via RDR)             (deadline passes)
                          |                         |                         |
                          v                         v                         v
                evidence_submitted            accepted_refund              expired
                          |                         |                         |
                          |                    (creates Refund               (auto-lost:
                          |                     via RefundOrchestrator)       finalization
                          v                          |                         chain fires)
                  under_bank_review                  |
                          |                         (terminal)                 |
              +-----------+-----------+                                        |
              |                       |                                        |
        (bank sides                 (bank                                      |
         with us)                    sides with                                |
              |                      customer)                                 |
              v                       |                                        |
             won                      v                                        v
                                     lost <-----------------------------------+
                                       (terminal — finalization chain fires)
                                       (records TWO offsetting transactions)
                                       (cascades marketing + clawbacks)

Legend:
  pending_evidence      - fresh chargeback; awaiting merchant response
  evidence_submitted   - EvidenceSubmitter dispatched to provider
  under_bank_review    - bank confirmed receipt + started their internal review
  won                  - bank sided with us; parent Payment.amount_disputed_cents reduced back
  lost                 - bank sided with customer; money permanently gone
  expired              - evidence deadline passed with no submission; treated as auto-lost
  accepted_refund      - RDR path taken; auto-refund created via refund module BEFORE chargeback fully files
```

Cancel is NOT a valid transition. Chargebacks are BANK-INITIATED — the merchant
cannot cancel them. The only merchant escape hatches are:

1. **Accept via RDR** — Rapid Dispute Resolution (Visa-specific, Medium+ tier).
   Auto-refund below the RDR threshold to close the pre-chargeback state before
   the chargeback fully files. Only viable when
   `chargeback.status='pending_evidence'` and `chargeback.rdr_eligible=true`.
2. **Submit evidence** — normal defense path. Bank reviews + decides won / lost.
3. **Do nothing** — evidence deadline passes → `expired` → auto-lost.

Terminal states (won / lost / expired / accepted_refund) are IMMUTABLE —
`ChargebackObserver.updating` refuses ALL field mutations post-terminal.

`ChargebackObserver.updating` enforces every one-way transition. Two P1 signals:

- Attempted transition from a terminal state to anything:
  `CHARGEBACK_IMMUTABLE`.
- Attempted transition skipping states (e.g. `pending_evidence` → `won` without
  going through `evidence_submitted` + `under_bank_review`):
  `CHARGEBACK_INVALID_STATE_TRANSITION`.

## 4. Reason codes — the card network catalogues

Every chargeback carries a network-native reason code + a canonical category.
The reason code enum is per-network — Visa uses `10.4`; Mastercard uses `4837`;
Amex uses `F24`. The `reason_category` enum unifies them:

- **`fraud`** — cardholder claims the transaction was unauthorized. Visa: 10.4,
  10.5. Mastercard: 4837. Amex: F14, F24, F29.
- **`authorization`** — auth issues (declined but processed, expired card).
  Visa: 11.1, 11.2, 11.3. Mastercard: 4808, 4812.
- **`processing_errors`** — merchant processed the transaction incorrectly
  (duplicate, wrong amount, wrong currency, credit not processed). Visa:
  12.1-12.7. Mastercard: 4834, 4842. Amex: P01, P05.
- **`consumer_disputes`** — customer received the goods/services but has a
  service quality dispute. Visa: 13.1-13.9. Mastercard: 4841, 4853, 4855.
  Discover: 4842, 4855.
- **`card_recovery`** — special card status (card recovery bulletin). Rare.

Full catalogue in `data/reason-code-catalog.json` (40+ codes across 8 networks).
The `valid_reason_code` rule enforces per-network validity. Every chargeback
carries `network` + `reason_code` + `reason_category` + a human-readable
`reason_description` frozen at creation.

## 5. Evidence submission — what we send to the bank

Evidence is bundled into a `ChargebackEvidence` row and submitted to the
acquiring bank via the provider. Every evidence bundle includes ALL of these
fields (populated as best-effort; missing pieces marked null):

- **`invoice_evidence`** —
  `{ invoice_id, invoice_pdf_url_signed, line_items[] }`. The parent invoice
  PDF + line-item detail. Auto-collected from `invoice` module.
- **`receipt_evidence`** — `{ receipt_url, receipt_number, receipt_date }`. The
  receipt from the original payment. Auto-collected from `payment` module.
- **`service_documentation`** —
  `{ service_dates[], attendance_records[], coach_signatures[] }`. Records that
  the service was actually delivered (attendance logs, coach signatures on the
  roster). Auto-collected from `attendance` module (when present).
- **`refund_policy`** —
  `{ policy_url, policy_snapshot_at_purchase, cooling_off_days }`. The tenant's
  refund policy at purchase time. Auto-collected from `settings` module.
- **`communication_log`** —
  `{ message_ids[], support_ticket_ids[], call_recording_urls[] }`. Every
  communication with the customer around the disputed purchase. Auto-collected
  from `notifications` module + `support` module.
- **`shipping_docs`** — `{ tracking_number, delivery_confirmation_url }`
  (nullable — only for physical goods; typically null for a fitness academy).
- **`customer_signature_evidence`** —
  `{ signature_url, ip_address, timestamp, device_fingerprint_hash }`.
  Terms-of-service acceptance signature + IP + device fingerprint from the
  checkout flow.
- **`uncategorized_text`** — freeform additional context the admin may add
  manually.

`EvidenceCollector` runs `CollectChargebackEvidenceJob` immediately on
chargeback creation to pre-populate everything auto-collectable. Admin reviews +
potentially edits + submits via POST /chargebacks/{chargeback}/evidence.

Each submission creates a NEW `ChargebackEvidence` row with
`submission_attempt_number` incremented. Rows are IMMUTABLE after creation.
Typically 1 submission is enough; some networks may request additional evidence
(e.g. CE3.0 second pass) triggering attempt 2.

## 6. Rapid Dispute Resolution (RDR) — Visa's pre-chargeback path

RDR is Visa's fast-lane to close pre-chargeback disputes: instead of fighting
through the full chargeback flow, the merchant pre-agrees to auto-refund below a
configured amount. RDR eligibility is determined at chargeback creation:

- Network is Visa.
- Chargeback amount ≤ tenant's configured
  `chargeback.rdr.auto_refund_threshold_cents` (default 5000 = $50).
- Tenant holds `chargeback_rdr` entitlement (Medium+).
- Payment hasn't been previously refunded.

When `rdr_eligible=true` and admin clicks POST /chargebacks/{chargeback}/accept:

1. `RdrHandler::accept($chargeback)` creates a Refund via
   `refund::RefundOrchestrator::create()` with reason='chargeback_prevention' +
   refund_type='full' + amount_cents=chargeback.amount_cents +
   refunded_to='original_payment_method'.
2. On RefundSucceeded, chargeback transitions to `accepted_refund` (terminal).
   Fires `ChargebackAcceptedRefund` + `ChargebackAcceptedRefundNotification`
   (customer + admin).
3. Chargeback carries `refund_id` for cross-reference.
4. The bank sees the refund + closes the pre-chargeback state WITHOUT filing a
   full chargeback. NO network fee. NO chargeback-rate impact.

RDR is the cheapest defense — no network fee ($15-25 saved per case) + no rate
impact. Recommended for low-value disputes where fighting isn't cost-effective.

## 7. Compelling Evidence 3.0 (CE3.0) — Visa's evidence framework

CE3.0 is Visa's evidence framework introduced 2023. It structures fraud-reason
evidence around "two prior legitimate purchases with matching identifiers" (IP,
device fingerprint, email, shipping address). When applicable + tenant holds
`chargeback_ce3` entitlement:

- `Ce3EvidenceBuilder::assemble($chargeback)` queries the payment module for two
  prior successful payments from the same customer with matching identifiers
  (IP + device fingerprint hash).
- Assembles the CE3.0 evidence shape:
  `{ prior_purchase_1: {...}, prior_purchase_2: {...}, matching_identifiers: {...}, evidence_category: 'CE3.0' }`.
- The evidence bundle carries a `ce3_bundle` metadata field.

CE3.0 evidence has HIGH win rates (bank auto-approves when the shape is valid).
Requires at least 120 days of purchase history + 2 prior legitimate purchases
from the same customer.

## 8. Every LOST chargeback triggers the finalization chain

`ChargebackObserver.updating` (fires only after the row commits transition to
`status=lost` OR `status=expired` — `ShouldDispatchAfterCommit`):

1. **`TransactionRecorder::recordChargebackLoss($chargeback)`** — double-entry
   ledger for the disputed amount:
   - Debit: `chargebacks_expense` account (loss recognised)
   - Credit: `cash` account (bank balance decreases)
   - Persists `transaction_id` on the chargeback row.
2. **`NetworkFeeCalculator::compute + TransactionRecorder::recordChargebackFee($chargeback)`**
   — SECONDARY offsetting transaction for the network fee (typically $15-25
   depending on network):
   - Debit: `chargeback_fees` account (fee expense)
   - Credit: `cash` account (bank balance decreases again)
   - Persists `fee_transaction_id` on the chargeback row.
3. **`InvoiceStateUpdater::markDisputed($chargeback)`** — updates parent
   invoice.status='disputed' + payment.amount_disputed_cents to reflect the
   permanent loss.
4. **`ClawbackCoordinator::fanOut($chargeback)`** — dispatches domain events:
   - `ChargebackClawbackReferral` → cascades to `referrals` module (reverse any
     materialized referral reward tied to the disputed invoice).
   - `ChargebackClawbackCoupon` → cascades to `coupon` module (reverse any
     redeemed coupon tied to the disputed invoice).
5. **`marketing::ChargebackFiled`** — via
   `FireMarketingChargebackFiledOnChargebackLost` hook:
   - Fires domain event `finance.chargeback_filed`
   - Growth module captures + fans out to ad networks with a NEGATIVE-VALUE
     CONVERSION event AND a FRAUD signal (the click IDs behind
     chargeback-generating purchases feed fraud model retraining — ad networks
     reduce bidding on similar profiles).

All five run in the same DB transaction as the `lost` status update — a
Chargeback row NEVER exists in `status=lost` without its two transactions +
invoice state update. If any step fails, the whole chain rolls back (transient)
OR admin must retry via `chargeback:reconcile` (persistent failure).

WON chargebacks trigger a smaller chain:

1. **`ReducePaymentDisputedOnChargebackWon`** — reduces parent
   payment.amount_disputed_cents back to reflect the win. NO fee refund from the
   network (won chargebacks still incur the initial network fee — banks don't
   refund the fee they collected). Fires `ChargebackWon`.
2. `notifications::ChargebackWonNotification` (admin only — no customer message
   on wins; the customer's bank informs them).

## 9. Chargeback rate monitoring

Card networks enforce merchant chargeback rate thresholds — exceeding them
triggers merchant-account risk programs:

- **Visa VDMP (Visa Dispute Monitoring Program)** — 0.9% (100 chargebacks /
  10,000 transactions). Enrollment triggers additional fees + monitoring;
  sustained breaches lead to merchant-account termination.
- **Visa VFMP (Visa Fraud Monitoring Program)** — fraud-only, tighter
  thresholds.
- **Mastercard MDMP (Mastercard Dispute Monitoring Program)** — 1.5% (150
  chargebacks / 10,000 transactions).
- **Amex Enhanced Dispute** — 1.0%.
- **Discover Merchant Dispute Program** — 1.0%.

`ChargebackRateCalculator::compute($tenant)` runs nightly via
`MonitorChargebackRateJob`. Computes a rolling 60-day rate per network:

```
rate = chargebacks_count / transactions_count over 60 days
```

When rate ≥ 0.9% (or per-network threshold): fires
`ChargebackRateThresholdExceeded` (P1) + dispatches
`ChargebackRateThresholdExceededNotification` (P1 admin). Tenant admin sees the
alert in the SDUI rate-report dashboard. Stackra platform ops receives the
cross-tenant alert via GET /api/v1/platform/chargebacks/rate-threshold-alerts.

Thresholds are configurable per tenant via
`chargeback.rate_monitoring.threshold_visa_percent` (etc.) — some enterprise
tenants may enforce stricter internal thresholds (e.g. 0.5% early-warning).

## 10. Provider webhook path

Chargebacks originate from provider webhooks (Stripe `charge.dispute.created`,
Paddle `transaction.chargeback`, Adyen `NOTIFICATION_OF_CHARGEBACK`). The
webhook path:

1. Provider dispatches webhook to `POST /api/v1/webhooks/{provider}` (owned by
   `payment` module).
2. `payment::PaymentWebhookHandler` verifies signature + routes chargeback-typed
   events to `HandleChargebackWebhook` listener in this module.
3. `HandleChargebackWebhook` parses the provider payload + calls
   `ChargebackOrchestrator::createFromWebhook($providerEvent)` OR
   `ChargebackReconciler::reconcileFromWebhook($providerEvent)` (for status
   updates on existing chargebacks).

Webhook verification is HIGH-STAKES — a spoofed chargeback webhook could trigger
a fraudulent refund. Every webhook carries a provider-specific signature that
the payment module's `PaymentWebhookVerifier` middleware validates before
routing.

## 11. Downstream clawback fan-out

Every LOST chargeback fires two clawback events (same shape as refund module,
distinct events):

### 11.1 `ChargebackClawbackReferral`

Fires when the disputed invoice was linked to a materialized `ReferralReward`.
Payload:

- `chargeback_id`, `invoice_id`, `referral_reward_id`, `reward_type`,
  `reward_amount_cents`.

The referrals module reverses the reward via `ProcessChargebackClawback` —
vested rewards return to `reversed`; materialized coupon rewards reverse the
redemption; cash-credit rewards offset + notify the referrer with a "chargeback
loss" reason.

### 11.2 `ChargebackClawbackCoupon`

Fires when the disputed invoice had a redeemed coupon. Payload:

- `chargeback_id`, `invoice_id`, `coupon_redemption_id`, `coupon_id`.

Coupon module handles via `ProcessCouponClawbackOnInvoiceCharged` — sets
`reversed_at` on the redemption + decrements `coupon.usage_count` + records the
clawback reason as 'chargeback'.

## 12. Marketing negative-value conversion + fraud signal

Every LOST chargeback fires `marketing::ChargebackFiled` (Wave 5 bridge).
Distinct from refund's negative-value conversion in TWO ways:

1. **Negative-value conversion** — same as refund. The disputed amount is
   deducted from ad campaign ROAS.
2. **Fraud signal** — chargebacks-especially-fraud-reason feed ad-network fraud
   models MORE HEAVILY than refunds. The `reason_category` field is passed to
   the ad network so it can distinguish `fraud`-labeled chargebacks (retrain
   fraud models aggressively) from `consumer_disputes`-labeled chargebacks
   (product-quality signal, adjust bidding gently).

Consent-gate: `advertising` tier. Customers who have withdrawn advertising
consent have their chargebacks suppressed at dispatch (advertising lane skips).
Chargeback still lands internally; only the marketing lane skips.

## 13. Tier gating

- **Small** — `chargeback_management` on. `chargeback_evidence_submission` on
  (default — evidence workflow available). `chargeback_rate_monitoring` on. 7y
  retention. No RDR, no CE3.0.
- **Medium** — Adds `chargeback_rdr` (Rapid Dispute Resolution auto-refund path
  — Visa only). `chargeback_ce3` (Compelling Evidence 3.0 evidence builder).
  `chargeback_advanced_reporting` (rate + reason + provider distribution
  reports).
- **Enterprise** — Adds `chargeback_extended_retention` (7y → 10y for regulated
  tenants). All Medium features.

Enforced by `chargeback_management` (master gate — chargebacks still fire
regardless when the gate is off because they're bank-forced; only the workflow
features gate here) + `chargeback_evidence_submission` (evidence workflow) +
`chargeback_rdr` (RDR path) + `chargeback_ce3` (CE3.0 builder) +
`chargeback_rate_monitoring` (rate tracker + alerts) +
`chargeback_extended_retention` (10y) + `chargeback_advanced_reporting` (rich
reports).

## 14. Compliance

- **Card network rules** — chargeback rate above 0.9% (Visa) / 1.5% (Mastercard)
  triggers merchant-account risk programs (VDMP / MDMP). Every chargeback + rate
  report retained for network audit. Sustained breach of thresholds can lead to
  merchant-account termination.
- **PCI-DSS Req 3.4** — chargeback evidence must not include card
  PAN/CVV/magnetic stripe. Only tokens + last-4 + BIN.
  `ChargebackEvidenceObserver` refuses evidence blobs containing PAN patterns.
- **PCI-DSS Req 10.5.3** — audit trail on every chargeback state transition
  retained 1y online + 3y total minimum. Our 7y default exceeds.
- **SOX §404** — audit trail on every state transition (Auditable trait, 7y
  retention). Internal controls over financial reporting — chargebacks are
  material revenue-recognition reversals.
- **CFPB (US)** — Fair Credit Billing Act compliance; consumer chargeback rights
  unaffected. Merchant cannot retaliate against a customer who filed a
  chargeback.
- **PSD2 (EU)** — chargeback disputes on card transactions follow the bank's
  dispute resolution process. Strong Customer Authentication (SCA) records
  surface as evidence (customer_signature_evidence).
- **GDPR Art. 6(1)(b)** — contractual + legitimate interest basis for retention.
- **GDPR Art. 17** — TenantErased cascades hard-delete except financial records
  → migrated to compliance_archive per Art. 17 §3 exception.
- **VAT / Sales Tax** — chargebacks reduce output VAT similar to refunds. Credit
  note issued (via `invoice::CreditNoteIssuer`) on lost captures the tax
  reversal.
- **AML** — chargeback records retained + submitted per regulator when requested
  (7y baseline; 10y Enterprise).
- **WCAG 2.2 AA** — chargeback list, detail, evidence submission UI +
  rate-report dashboard meet AA contrast + keyboard navigation.

## 15. Retention

- `chargebacks` — 7 years post-`decision_at` (or `filed_at` when never
  terminal). 10 years Enterprise `chargeback_extended_retention`.
- `chargeback_evidence` — co-terminous with parent chargeback (FK CASCADE).
- `TenantErased` — FK CASCADE hard-deletes non-invoice-linked chargebacks.
  Invoice-linked chargebacks migrate to `compliance_archive.chargebacks` +
  `compliance_archive.chargeback_evidence` prior to cascade
  (financial-obligation retention per GDPR Art. 17 §3 exception). Audit rows
  outlive the source rows.

## 16. What this module does NOT do

- **No direct chargeback creation over HTTP.** Chargebacks are created only via:
  (1) `payment::PaymentDisputeLost` cascade (fires
  `CreateChargebackFromDisputeJob`), or (2) provider webhook
  (`HandleChargebackWebhook` listener). No POST /api/v1/chargebacks route
  exists.
- **No fraud detection ML on chargebacks.** Delegated to `payment` module's
  `FraudChecker` at capture time (prevents chargeback-generating payments
  upstream). This module records the outcome; it doesn't predict it.
- **No cross-tenant chargebacks.** Chargebacks are tenant-scoped. A chargeback
  on tenant A cannot reference a payment on tenant B.
- **No `application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id` on any owned row.** All cascade through `tenant_id`. Enforced
  by tenancy-compliance-auditor.
- **No mutation of chargeback rows after terminal status.** Chargebacks are
  IMMUTABLE post-won / lost / expired / accepted_refund. Corrections require ops
  investigation + optionally a manual reversal transaction in the transaction
  module.
- **No card storage anywhere.** Chargeback uses provider token from the parent
  payment. Evidence NEVER stores card PAN / CVV / magnetic stripe / PIN.
- **No customer-facing chargeback interaction.** Customers file with their bank,
  not with us. Our customer surfaces do not display chargeback-related
  information (some networks explicitly prohibit exposing chargeback status to
  the customer).
- **No merchant-initiated chargeback filing.** Merchants can only defend (submit
  evidence) or accept (RDR path). Chargebacks are always customer-initiated.

## 17. Cross-references

- `hierarchy.md` §1b + §7 — finance module vocabulary + tier matrix.
- `tenancy-columns.md` §3 + §5 — chargeback tables carry `tenant_id`; NEVER
  `application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id`.
- `growth-and-observability.md` — chargeback.filed fires
  marketing::ChargebackFiled (negative-value + fraud signal + fraud-model
  retraining).
- `modules/finance/blueprints/payment/` — the parent record for every
  chargeback. PaymentWebhookVerifier owns webhook signature verification.
  PaymentDisputeLost is the primary chargeback-creation trigger.
- `modules/finance/blueprints/refund/` — RDR path creates a Refund via
  refund::RefundOrchestrator. Chargeback module references refunds via refund_id
  (RESTRICT).
- `modules/finance/blueprints/invoice/` — CreditNoteIssuer creates the reversal
  credit note on `lost`. InvoiceStateUpdater sets `status='disputed'`.
- `modules/finance/blueprints/transaction/` — TransactionRecorder records TWO
  offsetting ledger entries on `lost` (disputed amount + network fee).
- `modules/finance/blueprints/coupon/` — coupon clawback cascade target on
  `lost`. ChargebackLost fires `ChargebackClawbackCoupon`.

## 18. ULID prefixes owned

- `cbk_` (Chargeback) — new.
- `cev_` (ChargebackEvidence) — new.

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

**Never confuse with:**

- `pay_` (Payment), `pdi_` (PaymentDispute), `rfd_` (Refund), `ivc_` (Invoice),
  `trx_` (Transaction), `crn_` (CreditNote).
- `ten_` (Tenant), `usr_` (User), `mbr_` (Membership).

Consumed (referenced via FK): `ten_`, `usr_`, `pay_`, `pdi_`, `ivc_`, `trx_`,
`rfd_`, `iln_` (invoice_line), `rrw_` (referral_reward — cascaded), `cpn_`
(coupon — cascaded), `crd_` (coupon_redemption — cascaded).
