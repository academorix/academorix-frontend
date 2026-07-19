# transaction — changelog

## [Unreleased] — inception (Wave 4)

- Transaction module authored. TWO owned aggregates:
  - `Transaction` (`trx_`) — the money-movement ledger. Belongs to Tenant. References Invoice / Payment / Refund / Chargeback / CouponRedemption / TaxRemittance / TenantProvisioning polymorphically. IMMUTABLE after post.
  - `TransactionLedgerEntry` (`tld_`) — double-entry line items. Debit XOR credit per row. SUM(debits) == SUM(credits) per transaction (load-bearing double-entry invariant).
- Five entitlement gates:
  - `transaction_capture` (master, all tiers).
  - `transaction_multi_currency` (Medium+).
  - `transaction_advanced_reporting` (Medium+).
  - `transaction_ledger_reconciliation_api` (Enterprise).
  - `transaction_extended_retention` (Enterprise — 7y → 10y).
- Twelve transaction kinds: invoice_payment / refund_issued / chargeback_debit / coupon_credit / tax_remittance / fee_charge / adjustment / write_off / bank_deposit / bank_withdrawal / currency_conversion / opening_balance. Documented in `data/kind-catalog.json` with canonical debit/credit patterns.
- Fourteen chart-of-accounts entries: revenue / accounts_receivable / cash / refunds_owed / refunds_expense / tax_payable / gateway_fees / bank_deposits / write_offs / coupons_expense / chargebacks_expense / accounts_payable / prepayments / deferred_revenue. Documented in `data/chart-of-accounts-catalog.json` with regulator_category (asset / liability / equity / revenue / expense).
- Ten canonical double-entry patterns in `data/sample-double-entry-patterns.json` covering invoice_payment, refund_issued (paired), chargeback_debit, coupon_credit, tax_remittance, fee_charge, write_off, bank_deposit, bank_withdrawal, currency_conversion.
- Three exchange-rate providers: openexchangerates (default), fixer_io, ecb_daily (fallback). Documented in `data/currency-conversion-provider-catalog.json`.
- Load-bearing invariants:
  - **Double-entry balance** — SUM(debit_cents) == SUM(credit_cents) per transaction. Enforced by `TransactionObserver::finalize()` at post time + reasserted nightly by `ReconcileLedgerBalancesJob`.
  - **Immutability after post** — every posted transaction is IMMUTABLE. TransactionObserver.updating refuses ALL updates. Corrections happen via new offsetting transactions.
  - **Currency freeze** — cross-currency `exchange_rate_to_base` + `base_amount_cents` captured atomically at commit; immutable thereafter (IAS 21 compliance).
  - **Debit XOR credit** — every ledger entry populates exactly one of debit_cents / credit_cents (never both, never neither).
  - **Reversal via new offsetting transaction** — no in-place mutation; every correction creates a NEW transaction with source_transaction_id + reversal_reason.
  - **Tenant halt on imbalance** — LedgerImbalanceDetected sets `tenant.transaction_halt_new = true`; new transactions refused until ops resolves.
  - **Unique transaction_number per (tenant, year)** — Postgres advisory lock guarantees monotonicity; DB partial unique index guarantees uniqueness.
- Reconciliation:
  - Nightly `ReconcileLedgerBalancesJob` (02:00 UTC).
  - Three scopes: per_transaction / per_account_daily / global_tenant.
  - Fires `LedgerImbalanceDetected` (P0) per imbalance.
  - Fires `AccountBalanceThresholdCrossed` per threshold crossing.
  - Fires `LedgerReconciliationCompleted` per tenant.
- Retention:
  - Transactions + ledger entries: 7 years post-effective_date (10 for Enterprise via `transaction_extended_retention`).
  - Weekly `PurgeExpiredTransactionDataJob` (Sunday 04:00 UTC).
  - NEVER hard-purges without first archiving to compliance-storage.
  - `TenantErased` fires `ArchiveTransactionsToComplianceOnTenantErased` BEFORE the FK CASCADE.
- CRITICAL DISTINCTION documented throughout: `Transaction` (money movement) is NEVER conflated with `Invoice` (money owed), `Payment` (gateway capture), `Refund` (customer refund request), or `Membership` (customer contract). Different tables, different concerns, different retention where applicable.
- Ten published events across transaction + ledger + reconciliation lifecycles.
- Four notification categories: `transaction.ledger_imbalance` (P0 — cannot-opt-out), `transaction.amendment_applied` (regulator-critical — cannot-opt-out), `transaction.account_balance_alert` (informational — opt-in), `transaction.monthly_ledger_report` (informational — opt-in).
- Three broadcast channels: tenant transactions + tenant ledger + tenant ledger reconciliation.
- Read-only HTTP surface (admin + finance role). ONE write endpoint: POST /transactions/{id}/reverse (admin-only, requires note ≥ 10 chars). Every reversal writes a critical audit row.
- Cascade paths:
  - InvoicePaid → RecordInvoicePaidTransactionJob → one transaction with cash/AR entries.
  - RefundIssued → RecordRefundIssuedTransactionJob → TWO transactions (refund_issued + adjustment for revenue reversal).
  - ChargebackFiled → RecordChargebackTransactionJob → one transaction with chargebacks_expense/cash entries.
  - CouponRedeemed → RecordCouponRedeemedTransaction → one transaction with coupons_expense/revenue entries.
  - TaxRemitted → RecordTaxRemittedTransaction → one transaction with tax_payable/cash entries.
  - PaymentCaptured (with gateway fee) → RecordGatewayFeeTransaction → one fee_charge transaction.
  - InvoiceWrittenOff → RecordWriteOffTransaction → one write_off transaction.
  - TenantProvisioned → RecordOpeningBalanceOnTenantProvisioned → one opening_balance transaction.
  - TenantErased → ArchiveTransactionsToComplianceOnTenantErased → export to compliance-storage → PurgeTransactionDataForErasedTenant → FK CASCADE.
  - LedgerImbalanceRaised → HaltNewTransactionsOnImbalance → tenant.transaction_halt_new=true.
  - LedgerImbalanceResolved → ResumeNewTransactionsAfterResolution → tenant.transaction_halt_new=false.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`, `compliance`, `invoice`, `membership`, `tax`.
- Extended by NONE.
- Planned consumers: `payment` (Wave 4.5), `refund` (Wave 4.5), `chargeback` (Wave 4.5).

### Design notes

- **Transaction is the ONE atomic recording path.** Every business-level money movement in the platform flows through `TransactionRecorder`. Invoice / payment / refund / chargeback / coupon / tax modules NEVER write their own ledger entries — they fire events, listeners here record.
- **No HTTP create endpoint.** Direct API creation of transactions is FORBIDDEN. Prevents ledger tampering. The one write endpoint is the reversal endpoint, which creates a new offsetting transaction (never mutates).
- **Double-entry is the load-bearing invariant.** Every violation fires `LedgerImbalanceDetected` (P0) + pages on-call + halts new transactions. The nightly reconciler provides defense-in-depth.
- **Immutability + reversal-via-offset preserves the regulator audit trail.** Original transactions never change. A refund creates a new refund_issued transaction + a new adjustment transaction — the original invoice-payment stays exactly as it was posted. Regulators can walk the full chain.
- **The frozen exchange rate is load-bearing for IFRS.** IAS 21 requires the transaction-date rate. Storing `exchange_rate_to_base` + `base_amount_cents` immutably at commit + using the frozen values for reporting achieves this.
- **Retention outlives the tenant.** TenantErased archives to compliance-storage BEFORE the FK CASCADE. Regulators can audit years after a tenant is deleted.
- **`tenant.transaction_halt_new` is a fast-fail circuit breaker.** When an imbalance is detected, new writes STOP — better to block than to compound the error. Ops clear the flag via `compliance::LedgerImbalanceResolved` after the fix.
- **No `application_id` / `organization_id` / `region_id` / `branch_id` / `scope_node_id` on any of the two tables.** Transactions cascade application via `tenant_id → tenants.application_id`. Regulator-preferred: transactions live at the tenant level.
- **PCI-DSS boundary.** No card / PAN / CVV / expiry data anywhere. Payment tokens live in the payment module. Transactions carry `reference_id` pointers only.
- **Notifications are transactional.** LedgerImbalanceDetected + TransactionAmendmentApplied are contract-critical — CAN-SPAM Section 5(a)(5)(A) exempts transactional messages from opt-out. Every fire is an ops incident.

### ULID prefix registration

- `trx_` (Transaction) — new
- `tld_` (TransactionLedgerEntry) — new

Register both in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`. Verify no collisions with pre-existing prefixes (`trn_` transaction is close — the new prefix uses `trx_` to disambiguate).

### Wave 4 → 4.5 migration notes

- Wave 4.5 lands the `payment` module. Once shipped, `PaymentCaptured` events fire `RecordGatewayFeeTransaction` for gateway fees.
- Wave 4.5 lands the `refund` module. Once shipped, `RefundIssued` events fire `RecordRefundIssuedTransactionJob` — the current stub listeners assume refund shape based on the ADR-8 refund contract; adjust when the real refund events land.
- Wave 4.5 lands the `chargeback` module. Once shipped, `ChargebackFiled` events fire `RecordChargebackTransactionJob`.
- Wave 5 lands `growth::marketing` revenue attribution — every posted transaction with kind IN ('invoice_payment', 'refund_issued') fires `growth::analytics::TrackRevenueMovement`.
- Wave 5+ may add automated revenue-recognition rules — deferred revenue → revenue transitions on service delivery. Currently manual.

### Wave 4.5+ enhancements to consider

- Automated revenue recognition (RevRec) via time-based deferrals + performance-obligation completion.
- Multi-legged transactions (e.g. a single invoice payment split across multiple accounts_receivable sub-accounts) via multiple debit-credit pairs in one transaction.
- FASB ASC 606 compliance for subscription revenue recognition.
- Real-time GL reporting API for Enterprise finance-team integration with external audit tools.
- Cryptocurrency ledgers (v2 concern — different regulator surface + block-chain confirmation requirements).
- Multi-tenant consolidated reporting (Enterprise) — a parent tenant sees an aggregated GL across child tenants (rare — most Enterprise tenants are single-tenant).
