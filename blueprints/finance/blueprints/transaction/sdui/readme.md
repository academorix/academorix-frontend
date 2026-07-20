# transaction — SDUI blueprints

Blueprint declarations for the transaction module's server-driven UI surfaces.

## Surfaces

### `resources/transaction/`

Tenant-facing transaction ledger. Admin + finance role.

- `list.screen.json` — filterable transaction ledger with kind chip + status
  badge + amount cell. Filters on kind, status, reference type + id, date
  range, currency.
- `view.screen.json` — full detail on one transaction: base fields + ledger
  entries table + reversal chain (source + reversals) + reference entity link.
  Includes an admin-only "Reverse" action (creates a new offsetting transaction
  with required note).

### `resources/ledger-account/`

Tenant-facing chart-of-accounts + running balance. Admin + finance role.

- `list.screen.json` — grid of all enabled accounts + current running balance
  + threshold state (below_low_watermark / above_high_watermark / normal) +
  regulator_category chip.
- `balance.screen.json` — deep-dive for one account: current balance in tenant
  base_currency + per-currency breakdown (for multi-currency tenants) +
  threshold config summary.
- `history.screen.json` — running-balance time series for one account.
  ?from&to date range filter. Renders line chart + entries table below the
  chart with running-balance-after-entry column.

### `resources/report/`

General Ledger report dashboard. Medium+ tier (via
`transaction_advanced_reporting` entitlement). Admin + finance role.

- `dashboard.screen.json` — top-level GL: per-account opening balance + all
  posted transactions + closing balance + total debits + total credits for the
  selected month. Filter by date range + regulator_category. Export buttons for
  CSV + JSONL.

### `resources/reconciliation/`

Reconciliation audit trail. All tiers for read; Enterprise for programmatic
API access (via `transaction_ledger_reconciliation_api` entitlement). Admin +
finance role.

- `report.screen.json` — last N reconciler runs + detected imbalances. Filter
  by resolved state. Includes drill-in link per imbalance to the affected
  transaction / account.

### `widgets/`

- `kind-chip.widget.json` — colour-coded chip for the 12 transaction kinds.
  Revenue-recognition kinds (invoice_payment / coupon_credit) render green;
  revenue-reduction kinds (refund_issued / chargeback_debit / write_off /
  adjustment) render red; neutral movements (tax_remittance / fee_charge /
  bank_deposit / bank_withdrawal / currency_conversion / opening_balance)
  render neutral grey.
- `account-picker.widget.json` — multi-select for chart-of-accounts entries.
  Filtered per-tenant to the enabled account list (from tenant settings).
  Groups options by regulator_category (asset / liability / revenue / expense).
- `balance-indicator.widget.json` — running-balance badge for one account.
  Shows amount (in base_currency) + trailing sparkline over the last 30 days +
  threshold state indicator (green / yellow / red).
