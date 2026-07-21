# invoice — changelog

## [Unreleased] — inception (Wave 4)

- Invoice module authored. Three owned aggregates:
  - `Invoice` — canonical money-owed record. One row per membership renewal or
    standalone purchase. 7-year retention (financial audit; 10 for Enterprise).
    Frozen billing address + currency + totals after finalize.
  - `InvoiceLine` — per-invoice line items. RESTRICT on parent invoice
    hard-delete. Draft-only mutation.
  - `CreditNote` — reversal invoices for refunds/adjustments/write-offs.
    Immutable after issuance. Retained indefinitely (financial audit).
- Nine entitlement gates:
  - `invoice_capture` (boolean, all tiers) — master gate.
  - `invoice_slot_per_month` (Small=100, Medium=1000, Enterprise=∞) — invoice
    creation cap.
  - `invoice_custom_series` (Medium+) — tenant-configurable INV/SO/RECEIPT
    series.
  - `invoice_multi_currency` (Medium+) — invoicing in non-default currencies.
  - `invoice_tenant_branded_pdf` (Medium+) — tenant branding on PDFs.
  - `invoice_dunning_advanced` (Enterprise) — custom dunning cadence.
  - `invoice_collections_integration` (Enterprise) — third-party collections
    agency handoff.
  - `invoice_extended_retention` (Enterprise) — 7y → 10y retention.
  - `credit_note_issuance` (all tiers) — credit note surface.
- Sequential per-tenant per-year invoice numbering via Postgres advisory lock —
  gap-free + collision-free under concurrent writes. Format:
  `{series?}-{YYYY}-{seq:06}` (e.g. `2026-000001`, `INV-2026-000001`,
  `CN-2026-000001`).
- Immutable-after-finalize invariant: once status transitions draft → open,
  totals + billing_address + currency are frozen. All corrections flow through
  credit note issuance.
- Two-audience access model: customers see own invoices via
  invoice.enforce_customer_scope middleware; admin+finance role manages
  tenant-wide invoices.
- Load-bearing money flow: membership::MembershipCreated →
  CreateInvoiceOnMembershipCreated (atomic) → Invoice.finalize →
  payment::PaymentIntentConfirmed → MarkPaidOnPaymentIntentConfirmed →
  InvoicePaid → FireMarketingCaptureOnInvoicePaid fires
  marketing::CaptureMembershipPurchasedMarketingEvent.
- Draft-to-paid state machine: draft → open → paid | partially_paid | void |
  past_due | refunded | disputed | uncollectible | written_off. Every transition
  observer-enforced + audit-logged.
- Dunning ladder: day+3/7/14/30/60 default cadence (Enterprise-customizable).
  InvoicePastDue → DispatchDunningRemindersJob → InvoicePastDueNotification per
  stage. Escalation to third-party collections agency at day+60 (Enterprise).
- Bad-debt handling: past_due → uncollectible → written_off. Every
  uncollectible + written_off is a P1 signal (financial-loss).
- Credit note flow: paid/partially_paid invoice → CreditNoteCreated →
  GenerateCreditNotePDFJob → CreditNoteIssued (customer notified) →
  CreditNoteApplied (transitions to refund / next_invoice / customer_balance).
- Reconciliation: nightly ReconcileInvoicePaymentsJob detects drift between
  invoice.amount_paid_cents and transactions.SUM(amount). Drift is a P1 signal.
- PDF rendering: DomPDF server-side (default template Stackra-branded;
  Medium+ tenant-branded; VAT-EU compliant layout available). S3 storage with
  SSE-KMS encryption; hot → Glacier migration at 7y.
- 23 events published; 10 notification categories; 12 background jobs; 15
  Artisan commands.
- 4 broadcast channels: `tenant.{id}.invoices`, `customer.{type}.{id}.invoices`,
  `invoice.{id}.lines`, `invoice.{id}.credit-notes`.
- 26 tenant-plane + 4 platform-plane HTTP routes.
- SDUI: 6 screens (invoice list + view, credit-note list + create, aging +
  revenue + tax-collected reports) + 4 widgets (invoice-status-chip,
  payment-terms-badge, currency-picker, aging-timeline).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`,
  `compliance`, `tax`, `coupon`, `membership`.
- Extended by NONE. Wave 4 transaction + payment + refund + chargeback modules
  are peers (they consume invoice via listener path:
  MarkPaidOnPaymentIntentConfirmed, IssueCreditNoteOnRefundIssued,
  MarkDisputedOnChargebackFiled).
- Wave 4 inception release.

### Design notes

- Invoice does NOT carry `application_id` / `region_id` / `organization_id` /
  `branch_id` / `scope_node_id`. Every row is tenant-scoped per
  tenancy-columns.md §3, with the forbidden columns of §5 explicitly absent.
- Every write to invoices / invoice_lines / credit_notes emits an audit row
  (Auditable trait) with 7-year retention (10 for Enterprise).
- Sequential numbering is IMMUTABLE per GAAP + IFRS + VAT Directive Art. 226.
  The advisory-lock pattern is defense against numbering gaps under concurrent
  writes.
- The immutable-after-finalize invariant is why credit notes exist — paid
  invoices cannot be mutated to correct errors; a credit note reverses the
  original + a new invoice may then be created.
- The billing_address snapshot pattern (frozen at issuance) allows customer
  profile changes without retroactive mutation of historical invoices.
- Multi-currency support requires currency frozen at issuance; multi-currency
  invoicing within one invoice is forbidden (currency mismatch on lines is
  refused).
- The load-bearing InvoicePaid → marketing::MembershipPurchased cascade is the
  primary revenue-attribution signal for the growth pipeline. Every paid
  membership invoice fires the marketing capture; the marketing module then fans
  out to all configured ad-network providers.
- Customer PII (billing_address, customer_tax_id) is classified RESTRICTED per
  data-classes.json — GDPR Art. 17 individual erasure operable via redaction on
  the immutable invoice row.
- Financial retention (7-10 years) supersedes GDPR Art. 17 tenant erasure via
  the Art. 17 §3 legal-obligation carve-out — the
  ArchiveInvoiceFinancialRecordsOnTenantErasure hook copies records to the
  compliance archive BEFORE the FK CASCADE fires.

### Compliance

- **SOX §404** — 7-year retention on financial records; state-machine +
  immutable-after-finalize invariants; sequential numbering enforced by DB
  unique constraint + Postgres advisory lock.
- **GAAP** — revenue recognition triggered on InvoicePaid; sequential numbering;
  matching principle honored via distinct issue_date + due_date + paid_at.
- **IFRS** — IAS 1 presentation, IFRS 15 revenue recognition (equivalent to ASC
  606).
- **PCI-DSS Requirement 3** — no PAN / CVV / expiry / cardholder name on any
  invoice row; payment tokens live in the payment module.
- **EU VAT Directive 2006/112/EC** — Art. 226 mandatory contents on VAT invoices
  (customer_tax_id, sequential number, tax rate + amount per line); Art. 233
  authenticity via SSE-KMS + signed URLs; Art. 244 retention (10y for
  Enterprise).
- **GDPR Art. 6(1)(b)** — contractual necessity basis for retention (supersedes
  consent revocation).
- **GDPR Art. 17 + §3 carve-out** — TenantErased archives BEFORE cascade;
  UserErased redacts PII while preserving the row.
- **CCPA §1798.100 + §1798.135** — right to know honored via customer
  own-invoice access; "sale" definition N/A (invoices are contractual, not sales
  of personal information).
- **CAN-SPAM Section 5** — invoice emails carry tenant physical address (from
  branding); dunning is transactional (exempt).
- **FDCPA (US) + EU consumer credit directive** — dunning tone bounded by
  config; collections handoff requires licensed agencies.
- **SOC 2 CC6.1, CC6.3, CC7.2** — encrypted PDFs, audit trail retention, P1
  signals on uncollectible + written_off + reconciliation drift.
