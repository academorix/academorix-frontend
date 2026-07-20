# transaction

The money-movement ledger. Wave 4 finance module. The load-bearing
financial-record backbone of the entire platform.

## 1. The name game

This module owns the word "transaction" — every symbol here carries
`Transaction*` or `TransactionLedgerEntry*`. Never conflate with sibling finance
concepts:

| `finance::Transaction`                      | Not to be confused with                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| A **money movement**                        | `finance::Membership` — the customer's paid contract with the academy         |
| Immutable append-only ledger row            | `invoice::Invoice` — the money OWED (created; may be paid, refunded, void)    |
| Records the movement of dollars             | `payment::Payment` — a specific gateway capture (Stripe / Paddle transaction) |
| One kind='invoice_payment' per paid invoice | `refund::Refund` — the customer's refund request (state machine)              |
| Balances via double-entry ledger            | `chargeback::Chargeback` — the customer's dispute filed with their bank       |
| Regulator-visible + immutable               |                                                                               |

The ONE word to remember: **transaction = the movement**. Everything else is
either the OWING (invoice), the CAUSE (membership / booking / renewal), or the
PROVIDER-side record (payment / refund / chargeback).

## 2. What this module owns

| Concern                  | Owned artefact                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Every money movement     | `Transaction` (`trx_`) — root record. Kind + amount + currency + effective_date + status.                             |
| Double-entry line items  | `TransactionLedgerEntry` (`tld_`) — debit/credit pair per movement.                                                   |
| Number generation        | `TransactionNumberGenerator` — Postgres advisory lock for monotonic 'TXN-YYYY-NNNNNNNN' sequences per (tenant, year). |
| Recording service        | `TransactionRecorder` — the ONE atomic write path. Called by invoice / payment / refund / chargeback modules.         |
| Reversal service         | `TransactionReverser` — creates a NEW offsetting transaction with source_transaction_id + reversal_reason.            |
| Exchange rate resolution | `ExchangeRateResolver` — captures + freezes cross-currency rate at commit.                                            |
| Chart of accounts        | `ChartOfAccountsRegistry` — 14-entry canonical account catalog with regulator_category.                               |
| Balance calculation      | `AccountBalanceCalculator` — read-through cache for per-account running balances.                                     |
| Reconciler               | `LedgerReconciler` — nightly integrity check; SUM(debits) == SUM(credits) per transaction + per account per day.      |
| Reporter                 | `LedgerReporter` — General Ledger CSV + JSONL export.                                                                 |
| Retention pipeline       | `PurgeExpiredTransactionDataJob` — archive to compliance-storage BEFORE hard-purge.                                   |

### 2.1 The two owned tables

- `transactions` — carries `tenant_id` (CASCADE) + optional
  `source_transaction_id` (RESTRICT self-ref) + optional `created_by_user_id`
  (RESTRICT). Polymorphic `reference_type` + `reference_id` (Invoice / Payment /
  Refund / Chargeback / CouponRedemption / TaxRemittance / TenantProvisioning).
- `transaction_ledger_entries` — carries `tenant_id` (CASCADE) +
  `transaction_id` (CASCADE) + optional `created_by_user_id` (RESTRICT).

None carry `application_id` (cascades through
`tenant_id → tenants.application_id`), `organization_id`, `region_id`,
`branch_id`, or `scope_node_id`. Enforced by `tenancy-columns.md` §5.

## 3. The double-entry invariant

Every transaction has AT LEAST TWO ledger entries. Every ledger entry populates
exactly one of `debit_cents` / `credit_cents` (never both, never neither).
Across every entry in a transaction:
`SUM(debit_cents) == SUM(credit_cents) > 0`.

Enforcement is layered:

1. **`debit_xor_credit` rule** — per-entry (returns
   `LEDGER_ENTRY_DEBIT_XOR_CREDIT`).
2. **`sum_debits_equals_sum_credits_per_transaction` rule** — reasserted at post
   time.
3. **`TransactionObserver::finalize()`** — the load-bearing check. Runs inside
   the transaction's atomic DB transaction, BEFORE `status='posted'` is set.
   Refuses with `LEDGER_IMBALANCE_ON_POST` + fires
   `LedgerImbalanceDetected(scope='per_transaction')`.
4. **`ReconcileLedgerBalancesJob`** — nightly integrity sweep. Reasserts the
   invariant per-transaction, per-account-daily, and globally per tenant.
5. **`immutable_after_post` rule** — no `UPDATE`s ever land on posted
   transactions. Corrections happen via new reversal transactions.

## 4. Transaction kinds (12)

Twelve `TransactionKind` enum values maps into canonical debit/credit pairs
(documented in `data/sample-double-entry-patterns.json`):

| Kind                  | Canonical entries                                      | Trigger                                                                                        |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `invoice_payment`     | [debit: cash, credit: accounts_receivable]             | Invoice paid — money moves in. Fired by `RecordInvoicePaidTransactionJob`.                     |
| `refund_issued`       | [debit: refunds_owed, credit: cash]                    | Refund issued — money moves out. Paired with an `adjustment` transaction for revenue reversal. |
| `chargeback_debit`    | [debit: chargebacks_expense, credit: cash]             | Chargeback filed by customer. Involuntary money leaves via bank dispute.                       |
| `coupon_credit`       | [debit: coupons_expense, credit: revenue]              | Coupon redeemed. Revenue reduction + marketing expense.                                        |
| `tax_remittance`      | [debit: tax_payable, credit: cash]                     | Tenant files + pays tax to regulator.                                                          |
| `fee_charge`          | [debit: gateway_fees, credit: cash]                    | Gateway fee (Stripe / Paddle) charged.                                                         |
| `adjustment`          | Variable                                               | Manual accounting adjustment. Also used for revenue reversal alongside refund_issued.          |
| `write_off`           | [debit: write_offs, credit: accounts_receivable]       | Uncollectible invoice written off.                                                             |
| `bank_deposit`        | [debit: bank_deposits, credit: cash]                   | Cash moved from operational cash into a bank deposit account (external banking flow).          |
| `bank_withdrawal`     | [debit: cash, credit: bank_deposits]                   | Cash moved from bank deposit back to operational cash.                                         |
| `currency_conversion` | [debit: cash (target currency), credit: cash (source)] | Explicit FX conversion of cash from one currency to another.                                   |
| `opening_balance`     | Any (zeroed by default)                                | Tenant provisioning. Fired by `RecordOpeningBalanceOnTenantProvisioned`.                       |

## 5. Chart of accounts (14)

Fourteen ledger accounts documented in `data/chart-of-accounts-catalog.json`.
Regulator-visible grouping via `regulator_category`:

- **Assets:** cash, accounts_receivable, bank_deposits, prepayments.
- **Liabilities:** accounts_payable, refunds_owed, tax_payable,
  deferred_revenue.
- **Revenue:** revenue.
- **Expenses:** refunds_expense, gateway_fees, coupons_expense,
  chargebacks_expense, write_offs.

Every account has a canonical `regulator_category` — the General Ledger report
groups by category for regulator-shaped statements.

## 6. Reversal via new offsetting transaction

Transactions are IMMUTABLE after `status='posted'`. Every correction — a refund,
a chargeback, an accounting adjustment — happens by creating a NEW offsetting
transaction:

```
Original transaction (trx_A, kind='invoice_payment', $100):
  [debit: cash $100]
  [credit: accounts_receivable $100]
  status='posted', posted_at=T1

Reversal transaction (trx_B, kind='refund_issued', $100,
                     source_transaction_id=trx_A,
                     reversal_reason='refund'):
  [debit: refunds_owed $100]
  [credit: cash $100]
  status='posted', posted_at=T2 > T1

Companion adjustment transaction (trx_C, kind='adjustment',
                                 source_transaction_id=trx_A,
                                 reversal_reason='refund'):
  [debit: refunds_expense $100]
  [credit: revenue $100]
  status='posted', posted_at=T2
```

Both trx_A and its reversal chain (trx_B + trx_C) remain visible + immutable.
Regulators walk the chain to see the full audit story: invoice → payment →
refund → all three transactions.

Manual reversals via `POST /api/v1/transactions/{id}/reverse` use
`reversal_reason='accounting_adjustment'` — every one requires a written note ≥
10 chars + writes a critical audit row + fires `TransactionAmendmentRequested` +
`TransactionAmendmentAppliedNotification` (cannot-opt-out).

## 7. Multi-currency

Transactions can record in any currency. When
`transaction.currency != tenant.base_currency`:

1. `TransactionObserver.creating` requires the caller to supply
   `exchange_rate_to_base` + `base_amount_cents`.
2. `FreezeExchangeRateOnCrossCurrencyTransaction` hook validates the rate
   against `ExchangeRateResolver` (fresh fetch or cached, TTL 1h) with ±1 cent
   rounding tolerance.
3. `base_amount_cents = ROUND(amount_cents * exchange_rate_to_base)` — validated
   at commit.
4. The rate + base_amount are IMMUTABLE after commit — regulator-preferred for
   IFRS IAS 21 compliance.
5. `TransactionCurrencyConverted` fires (afterCommit).

Base-currency reporting aggregates every transaction via `base_amount_cents` —
historical reports are stable across currency rate changes.

Requires `transaction_multi_currency` entitlement (Medium+).

## 8. Reconciliation

Nightly `ReconcileLedgerBalancesJob` (02:00 UTC) computes:

1. Per-transaction: `SUM(debits) == SUM(credits)` for every posted transaction
   in the last 24h.
2. Per-account per day: `SUM(debits) == SUM(credits)` across every entry
   touching each account per day.
3. Global per tenant: base-currency-normalized `SUM(debits) == SUM(credits)`
   across the tenant.

Any non-zero delta fires `LedgerImbalanceDetected` (P0). The
`HaltNewTransactionsOnImbalance` listener sets
`tenant.transaction_halt_new = true` — new transactions REFUSED until an
ops-authored fix lands. Pages on-call.

Should NEVER fire in a healthy system. If it does, ops:

1. Read the imbalance details (scope, account, transaction).
2. Investigate the audit trail — probably a race condition or a bugged listener.
3. Author a correction (usually via `transaction:reverse` with
   `reversal_reason='error_correction'`).
4. Clear the halt flag via `compliance::LedgerImbalanceResolved`.
5. `ResumeNewTransactionsAfterResolution` listener sets
   `tenant.transaction_halt_new = false` — writes propagate.

## 9. Tier gating

Five entitlement gates:

- `transaction_capture` (all tiers, master) — every tenant has a ledger; flag
  exists so ops can halt writes during a P0.
- `transaction_multi_currency` (Medium+) — cross-currency transactions.
- `transaction_advanced_reporting` (Medium+) — monthly General Ledger report +
  custom exports.
- `transaction_ledger_reconciliation_api` (Enterprise) — programmatic
  reconciliation.
- `transaction_extended_retention` (Enterprise) — 10-year retention (default 7).

## 10. Retention

- Transactions + ledger entries: 7 years post-effective_date (10 for Enterprise
  via `transaction_extended_retention`).
- NEVER hard-purged without first archiving to compliance-storage.
  `PurgeExpiredTransactionDataJob` exports JSONL keyed by
  `(tenant_id, transaction_number, year)` before deleting.
- `TenantErased` fires `ArchiveTransactionsToComplianceOnTenantErased` BEFORE
  the FK CASCADE — the tenant's transactional data is deleted but the compliance
  archive lives on.

## 11. What this module does NOT do

- **Card storage.** Payment tokens live in the payment module. Transactions
  carry `reference_type='Payment'` + `reference_id` pointers — never PAN / CVV.
- **Gateway communication.** Transactions RECORD the movement that happened via
  a gateway; they never talk to the gateway itself. Stripe / Paddle integration
  lives in the payment module.
- **Bank / ACH integration.** `bank_deposit` + `bank_withdrawal` transactions
  RECORD external banking flows. The banking integration itself is out-of-scope
  for Wave 4.
- **Cryptocurrency.** Fiat only for v1. Crypto ledgers (with rate volatility +
  block-chain confirmations) are a v2 concern.
- **Revenue recognition automation.** Deferred revenue is a manual accounting
  exercise for now — a Wave 5+ concern will add automated revenue recognition
  rules.
- **Accountant-desktop-app export formats.** CSV + JSONL only for v1. No
  QuickBooks / Xero / SAP integration.
- **`application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id`.** Transactions are a tenant-level financial-record concern.

## 12. Cross-references

- `hierarchy.md` §1b — Transaction vs Invoice vs Payment vs Refund vs Membership
  terminology.
- `hierarchy.md` §14 — belongs-to matrix (Transaction → Tenant only).
- `tenancy-columns.md` §3 + §5 — transaction tables carry `tenant_id`; never
  carry
  `application_id`/`region_id`/`organization_id`/`branch_id`/`scope_node_id`.
- `modules/finance/blueprints/membership/` — the customer contract that spawns
  invoice payments.
- `modules/finance/blueprints/tax/` — the tax_calculation source feeding
  tax_payable ledger entries.
- `modules/finance/blueprints/coupon/` — the coupon module that fires
  `CouponRedeemed` → coupon_credit transaction.
- `modules/growth/blueprints/marketing/` — canonical style reference for
  ledger + delivery pattern (though marketing's structure is different — it fans
  out to N providers whereas transaction records N ledger entries per
  transaction).

## 13. ULID prefixes owned

- `trx_` — Transaction
- `tld_` — TransactionLedgerEntry

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

Consumed (referenced via FK / morph): `ten_` (Tenant), `usr_` (User), `ivc_`
(Invoice — Wave 4.5 sibling), `pay_` (Payment — Wave 4.5 sibling), `rfd_`
(Refund — Wave 4.5 sibling), `chb_` (Chargeback — Wave 4.5 sibling), `cpr_`
(CouponRedemption), `txr_` (TaxRemittance).
