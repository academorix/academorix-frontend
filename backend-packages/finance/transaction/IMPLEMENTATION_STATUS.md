# finance/transaction — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

`finance/transaction` is the double-entry accounting ledger — every
money movement lands as one debit + one credit against a chart-of-
accounts. This is the source of truth for:

- Financial reports (P&L, balance sheet, revenue recognition).
- Tax filings.
- External accounting system exports (Xero, QuickBooks).

### The ledger contract

Every `Transaction` row has:
- `chart_account_id` — the account it hits.
- `debit_minor` OR `credit_minor` — never both.
- `posted_at` — when it hit the ledger (may differ from `event_at`).
- `source_type` / `source_id` — polymorphic pointer to the domain event
  that generated the entry (Payment, Refund, MarketplaceFee, Payout).

The invariant: sum(debit) - sum(credit) = 0 within any (tenant_id,
posted_at_date) tuple.

### Actions to fill (12 total)

Read-only mostly — the ledger is APPEND-ONLY. No manual writes from the
API surface. Writes come from event listeners fired by other modules.

- `ListTransactionAction` — filters: chart_account_id, source_type,
  posted_at range.
- `ShowTransactionAction`
- `ListChartAccountAction` — the tenant's chart of accounts.
- `CreateChartAccountAction` / `UpdateChartAccountAction` — admin-only.
- `ShowChartAccountAction` / `DeleteChartAccountAction`
- `ExportLedgerAction` — POST /transactions/export — generates a CSV /
  IIF (QuickBooks) / OFX file for the requested date range. Response is
  a signed S3 URL from `finance/storage`.
- Platform view — cross-tenant.

### Support services

- `LedgerPoster` (Services/) — the ONLY service that inserts into
  `transactions`. Every posting is a matched pair of debit + credit,
  wrapped in a transaction. Called by event listeners.
- `LedgerReconciler` (Services/, nightly) — cross-checks the sum
  invariant per day and alerts on drift.
- `LedgerExporter` (Services/) — writes CSV / IIF / OFX exports.

### Event → ledger mappings

Table of "when this event fires, write this pair of ledger rows":

| Event                       | Debit                          | Credit                          |
| --------------------------- | ------------------------------ | ------------------------------- |
| `PaymentSucceeded`          | `cash.on_hand`                 | `revenue.membership`            |
| `RefundIssued`              | `revenue.membership` (reverse) | `cash.on_hand` (reverse)        |
| `MarketplaceFeeCollected`   | `expense.platform_fees`        | `cash.on_hand`                  |
| `ChargebackLost`            | `expense.chargeback_losses`    | `cash.on_hand`                  |
| `PayoutPaid`                | `cash.pending_transfer`        | `cash.on_hand`                  |
| `PayoutSettled`             | `cash.in_bank`                 | `cash.pending_transfer`         |
| `WalletCreditAdjustment`    | `liability.customer_credits`   | `cash.on_hand` (if funded)      |

### The `LedgerPoster` is a listener, not a service consumers call

Consumers dispatch events; `LedgerPoster` subscribes to the relevant
events and posts. This keeps the domain module clean of accounting
concerns — a `PaymentSucceeded` fires whether or not accounting is
enabled.
