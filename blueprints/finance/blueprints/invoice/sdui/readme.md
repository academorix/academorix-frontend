# invoice — SDUI blueprints

Blueprint declarations for the invoice module's server-driven UI surfaces.

## Surfaces

### `resources/invoice/`

Tenant-facing invoice management. Both customer + admin views.

- `list.screen.json` — filterable invoice list with status chips, aging
  indicators, past-due warnings. Filters: status, customer, series, currency,
  date range, past-due. Admin view; customer view (list.mine.screen.json) is
  auto-scoped by invoice.enforce_customer_scope middleware.
- `view.screen.json` — full detail on one invoice: header + billing address +
  lines table + totals + payment history + linked credit notes + audit timeline.
  Includes finalize / send / void / mark-paid actions when caller has
  admin+finance role.
- `create.screen.json` — draft invoice creation wizard: pick customer →
  optionally link membership → add lines → configure payment terms → save draft.

### `resources/invoice-line/`

Line-item editor embedded inside the invoice view. Only active while parent
invoice.status='draft'.

- `list.screen.json` — inline lines editor. Add/edit/delete lines with
  quantity + unit price + item type picker.

### `resources/credit-note/`

Credit note management.

- `list.screen.json` — credit note ledger view with reason filter + status
  chips.
- `create.screen.json` — issue a credit note against a paid invoice: select
  amount + reason + reason_note (when required) + confirm.

### `resources/reports/`

Financial reporting dashboards. Admin + finance role only.

- `invoice-aging.screen.json` — 0-30 / 31-60 / 61-90 / 91+ aging buckets with
  drill-down per customer. Uses the `invoice.aging-timeline` widget.
- `revenue.screen.json` — invoiced vs collected vs AR balance grouped by
  day/week/month/item_type. Time-series chart + summary cards.
- `tax-collected.screen.json` — tax collected grouped by jurisdiction. Feeds
  VAT/GST return preparation.

### `widgets/`

- `invoice-status-chip.widget.json` — colour-coded chip for invoice status
  (draft/open/paid/partially_paid/past_due/void/uncollectible/refunded/
  disputed/written_off).
- `payment-terms-badge.widget.json` — badge showing payment_terms + due date.
  Renders 'Due today' / 'Due in 3 days' / 'Overdue by 7 days' in traffic-light
  colors.
- `currency-picker.widget.json` — ISO 4217 currency picker with
  tenant.default_currency as default. Entitlement-aware — disables non-default
  currencies on Small tier.
- `aging-timeline.widget.json` — horizontal stacked bar chart showing AR balance
  across aging buckets. Interactive drill-down per bucket.
