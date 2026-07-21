# invoice

The money-owed record. Wave 4 finance infrastructure. Answers "how much does
this customer owe us, for what, and when's it due?".

## 1. What this module owns

| Concern                                 | Owned artefact                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| The customer-facing bill                | `Invoice` — one row per membership renewal or standalone purchase. 7-year retention (financial audit).  |
| Line items                              | `InvoiceLine` — one row per membership charge / addon / setup fee / late fee / adjustment / discount.   |
| Reversal invoices                       | `CreditNote` — one row per refund / adjustment / write-off / duplicate / dispute-resolution. Immutable. |
| Sequential invoice numbering            | `InvoiceNumberGenerator` + Postgres advisory lock — gap-free + collision-free per tenant per year.      |
| Credit note numbering                   | `CreditNoteNumberGenerator` — same pattern.                                                             |
| Draft → open finalization               | `InvoiceFinalizer` — freezes totals + billing_address + generates PDF + sends email.                    |
| PDF rendering                           | `InvoicePDFRenderer` — DomPDF default; wkhtmltopdf for Enterprise via `#[AsInvoicePdfRenderer]`.        |
| Dunning schedule                        | `DunningScheduler` — day+3/7/14/30/60 default; Enterprise-customizable.                                 |
| Payment reconciliation                  | `InvoicePaymentReconciler` — nightly sweep against the transactions ledger.                             |
| Credit note issuance                    | `CreditNoteIssuer` — creates the reversal row + fires the notification cascade.                         |
| Aging / revenue / tax-collected reports | `InvoiceAgingReporter` + `InvoiceRevenueReporter` + `InvoiceTaxCollectedReporter`.                      |

### 1.1 The three owned tables

- `invoices` — root record. Belongs to `Tenant`, polymorphic to
  `User`/`Athlete`/`Organization` customer. Optionally linked to `Membership` +
  `MembershipRenewal`. 7-year retention (10 for Enterprise).
- `invoice_lines` — per-invoice line items. Belongs to `Tenant` + `Invoice`
  (RESTRICT). Draft-only mutation.
- `credit_notes` — reversal invoices. Belongs to `Tenant` + `Invoice`
  (RESTRICT). Immutable after issuance. Retained indefinitely (financial audit).

None of these carry `application_id`, `region_id`, `organization_id`,
`branch_id`, or `scope_node_id` — every row is tenant-scoped per
tenancy-columns.md §3 with the forbidden columns of §5 explicitly absent.
Enforced by the tenancy-compliance-auditor.

## 2. Where this module sits in the finance stack

The finance stack has FOUR complementary modules that never conflate:

| Module               | Answers                                             | Key aggregate                           |
| -------------------- | --------------------------------------------------- | --------------------------------------- |
| **`membership`**     | Is this customer paying to attend?                  | `Membership` (subscription contract)    |
| **`invoice`** (this) | How much do they owe, for what, when's it due?      | `Invoice` (money owed)                  |
| **`transaction`**    | What movements happened in the double-entry ledger? | `Transaction` (money moved)             |
| **`payment`**        | When + how did the money physically transfer?       | `PaymentIntent` (payment provider link) |

Distinctions:

- **Invoice vs Transaction.** Invoices are the customer-facing bill (money
  OWED). Transactions are the accounting-facing ledger (money MOVED). Every
  payment records one or more transactions; some transactions may reference an
  invoice (via transaction.invoice_id RESTRICT).
- **Invoice vs Payment.** Invoices know WHAT is owed. Payments know WHEN + HOW
  the money moved. The MarkPaidOnPaymentIntentConfirmed listener bridges them —
  when payment.PaymentIntentConfirmed fires with metadata.invoice_id, the
  invoice status transitions to paid.
- **Invoice vs MembershipRenewal.** MembershipRenewal is the SCHEDULE-driven
  attempt to charge the customer for a period. Invoice is the resulting
  DOCUMENT. Every MembershipRenewal creates one Invoice.
- **Invoice.membership_id vs Invoice.customer_id.** membership_id links the
  invoice to the underlying subscription contract (for revenue attribution +
  marketing signal). customer_id is polymorphic to User/Athlete/Organization —
  who is being billed.

## 3. The load-bearing money flow

```
membership::MembershipCreated
   │
   │ (atomic same-tx via CreateInvoiceOnMembershipCreated hook)
   ▼
invoice.creating (draft) — freeze billing_address, generate invoice_number, add lines
   │
   │ (async — tax module computes)
   ▼
tax::TaxCalculationCompleted per line
   │
   │ (FinalizeInvoiceOnAllLinesTaxed hook when all lines taxed)
   ▼
invoice.status = 'open' + PDF generated + email sent
   │
   │ (async — customer clicks payment link)
   ▼
payment::PaymentIntentConfirmed
   │
   │ (via MarkPaidOnPaymentIntentConfirmed listener)
   ▼
invoice.status = 'paid' + InvoicePaid event
   │
   │ (via FireMarketingCaptureOnInvoicePaid hook)
   ▼
marketing::CaptureMembershipPurchasedMarketingEvent
   │
   │ (marketing lane fans out to 9 ad-network providers)
   ▼
Meta CAPI, Google Ads, GA4, TikTok, LinkedIn, Snapchat, Pinterest,
Custom Webhook, GTM Server — revenue signal delivered.
```

The InvoicePaid signal ALSO triggers
`membership::ActivateMembershipOnInvoicePaid` which transitions the parent
Membership to status='active' + generates Pass records for the period.

Every step is audit-logged with 7-year retention.

## 4. Sequential numbering — gap-free under concurrency

GAAP + IFRS + VAT Directive Art. 226 mandate sequential invoice numbering with
no gaps. The observer generates numbers via Postgres advisory lock:

```sql
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('invoice_seq:' || tenant_id || ':' || year));
SELECT max_seq FROM invoice_number_sequences WHERE tenant_id = ? AND year = ? FOR UPDATE;
UPDATE invoice_number_sequences SET max_seq = max_seq + 1 ... RETURNING max_seq;
COMMIT;
```

The lock is scoped to (tenant_id, year) — concurrent writers on the same tenant
serialize; different tenants proceed in parallel. The composite unique
constraint `(tenant_id, invoice_number) WHERE deleted_at IS NULL` is defense-
in-depth against advisory-lock failure.

Number format: `{series?}-{YYYY}-{seq:06}`.

- Small tier: locked to 'INV' series (config('invoice.numbering.default_series')
  = 'INV').
- Medium+ with invoice_custom_series: any 3-8 char uppercase alpha prefix.
- Credit notes: fixed 'CN-' prefix. `CN-{YYYY}-{seq:06}`.

## 5. Immutable-after-finalize

Once `invoice.status` transitions draft → open:

- `subtotal_cents`, `discount_amount_cents`, `tax_amount_cents`, `total_cents`
  FROZEN.
- `billing_address`, `shipping_address`, `customer_tax_id`, `currency` FROZEN.
- `invoice_number`, `issue_date` FROZEN.
- No line CRUD permitted.

Corrections flow ONLY through credit note issuance:

1. Customer paid too much → issue a credit note with reason='refund' +
   applied_to_type='refund' (money returned to payment method).
2. Customer overpaid but no refund → credit note applied_to='customer_balance'
   (offsets future invoice).
3. Tenant issued wrong invoice → credit note applied_to='next_invoice' (deducted
   from the next invoice for the customer).

Never mutate a paid invoice.

## 6. State machine

```
      draft
        │
        ├─→ open ──→ paid ──→ refunded (via credit note)
        │      │       │
        │      │       └─→ disputed (chargeback)
        │      │
        │      ├─→ partially_paid ──→ paid
        │      │           │
        │      │           └─→ past_due
        │      │
        │      └─→ past_due ──→ uncollectible ──→ written_off ──→ paid (rare recovery)
        │
        └─→ void
```

Every transition observer-enforced. Every transition audit-logged with actor +
timestamp + before/after snapshots.

## 7. Dunning ladder

Default cadence (day+3 / day+7 / day+14 / day+30 / day+60):

```
InvoicePastDue (MarkOverdueInvoicesJob nightly)
    │
    ▼ day+3
DispatchDunningRemindersJob('day_3')
    │ → InvoicePastDueNotification (friendly)
    ▼ day+7
DispatchDunningRemindersJob('day_7')
    │ → InvoicePastDueNotification (reminder)
    ▼ day+14
DispatchDunningRemindersJob('day_14')
    │ → InvoicePastDueNotification (firm)
    ▼ day+30
DispatchDunningRemindersJob('day_30')
    │ → InvoicePastDueNotification (final)
    ▼ day+60 (Enterprise with invoice_collections_integration)
EscalateDunningToCollectionsJob
    │ → InvoiceSentToCollectionsNotification (customer + admin)
    ▼ day+90
Admin manually marks uncollectible
    │
    ▼ day+180
Admin manually marks written_off
```

Enterprise tenants with `invoice_dunning_advanced` may customize the cadence via
settings.

## 8. Credit note flow

```
refund::RefundIssued for invoice
    │
    │ (via IssueCreditNoteOnRefundIssued listener)
    ▼
CreditNote.status = 'draft' + CreditNoteCreated event
    │
    │ (async)
    ▼
GenerateCreditNotePDFJob → PDF uploaded to S3
    │
    ▼
CreditNote.status = 'issued' + CreditNoteIssuedNotification (customer)
    │
    │ (admin applies via POST /credit-notes/{id}/apply)
    ▼
CreditNote.status = 'applied' + applied_to_type + applied_to_id set
```

The credit note is IMMUTABLE after status='issued' (except for the applied_to
fields on the issued → applied transition).

Sequential numbering: `CN-{YYYY}-{seq:06}`. Same advisory-lock pattern as
invoices.

## 9. Multi-currency support

- Small tier: locked to `tenant.default_currency`.
- Medium+ with `invoice_multi_currency`: any ISO 4217 currency, frozen at
  issuance.
- Multi-currency mixing WITHIN one invoice is forbidden — every line must have
  `unit_currency == invoice.currency`.
- Tax + coupon calculations happen in `invoice.currency` — no on-the-fly FX
  conversion inside the invoice.

Historical FX rates are the tax module's concern (via the TaxCalculation
snapshot).

## 10. Tier gating

- **Small** — Basic invoicing. Cap: 100 invoices/month. 'INV' series only.
  Tenant's default currency only. Default Stackra-branded PDF template.
  Default dunning cadence. Credit notes enabled.
- **Medium** — 1000 invoices/month. Custom series. Multi-currency. Tenant-
  branded PDFs. Default dunning cadence.
- **Enterprise** — Unlimited invoices. Everything above. Custom dunning cadence.
  Collections agency integration. 10-year retention.

Enforced by `invoice_capture` (master) + `invoice_slot_per_month` (volume cap) +
`invoice_custom_series` (Medium+) + `invoice_multi_currency` (Medium+) +
`invoice_tenant_branded_pdf` (Medium+) + `invoice_dunning_advanced`
(Enterprise) + `invoice_collections_integration` (Enterprise) +
`invoice_extended_retention` (Enterprise) + `credit_note_issuance` (all tiers).

## 11. Retention

- Invoices: 7 years default (10 for Enterprise). Migration to S3 Glacier at
  retention boundary; compliance-archive copy on TenantErased before FK CASCADE.
- Invoice lines: 7 years (cascaded via RESTRICT).
- Credit notes: 7 years default (10 Enterprise) in the primary DB; INDEFINITE in
  the compliance archive.
- PDFs: 7 years hot S3; 10y hot for Enterprise; then Glacier indefinitely.
- Individual UserErased (GDPR Art. 17): redact PII fields on affected invoices +
  credit notes; the row survives.
- TenantErased: ArchiveInvoiceFinancialRecordsOnTenantErasure copies records to
  compliance archive; then FK CASCADE hard-deletes.

## 12. What this module does NOT do

- **Card storage.** NO PAN / CVV / expiry / cardholder name on any invoice row.
  Payment tokens live in the payment module.
- **Payment processing.** The payment module handles Stripe / Paddle / gateway
  integrations. This module records that a payment happened.
- **Double-entry accounting ledger.** The transaction module is the ledger; this
  module is the customer-facing bill.
- **Revenue recognition automation.** ASC 606 / IFRS 15 revenue recognition
  timing is a downstream concern — this module fires InvoicePaid at the
  earned-time; the revenue module (v2) recognizes.
- **Deferred revenue tracking.** v2 concern.
- **Mutation of finalized invoices.** Credit notes are the only correction path.
- **FIFO/LIFO inventory accounting.** Invoices are receivables, not stock.
- **`application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id` on any row.** All are forbidden per tenancy-columns.md §5.
- **Cross-tenant reads.** Every query is tenant-scoped.
- **Dispute handling.** The chargeback module owns chargeback lifecycle; this
  module reflects the state on the invoice (paid → disputed).

## 13. Cross-references

- `hierarchy.md` §7 — tier matrix.
- `hierarchy.md` §11 — the finance + observability lane split.
- `tenancy-columns.md` §3 — every invoice table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every invoice row.
- `.kiro/steering/growth-and-observability.md` — the marketing lane's
  MembershipPurchased signal fires on InvoicePaid when membership_id is set.
- `modules/finance/blueprints/membership/` — CreateInvoiceOnMembershipCreated
  atomic contract source.
- `modules/finance/blueprints/tax/` — TaxCalculation snapshot referenced by
  invoice lines.
- `modules/finance/blueprints/coupon/` — CouponRedemption applied via
  ApplyCouponToInvoiceJob.
- `modules/growth/blueprints/marketing/` — MembershipPurchased marketing event
  consumer.
