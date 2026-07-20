# refund — SDUI blueprints

## Surfaces

### `resources/refund/`

Tenant-facing surfaces. Both customer + admin/finance audiences share the same
resource tree; the SDUI schema loader filters routes + fields by permission +
entitlement at render time.

- `list.screen.json` — filterable card grid with per-refund status chip;
  provider pill; reason badge; approval-required indicator. Filters: status,
  reason, refund_type, provider, refunded_to, requires_approval, initiated_at
  range, amount range. Customer variant scoped to /refunds/mine (own refunds
  only). Admin variant is full-tenant.
- `detail.screen.json` — single refund detail view. Two tabs: Timeline (state
  transitions + notifications sent) + Details (amount + parent payment link +
  parent invoice link + credit_note + transaction + refund_lines). Confidential
  financial fields (amount, currency, provider_fee_reversal_cents) render as
  `••••` when caller lacks refunds.view-financials.
- `request.screen.json` — customer-facing refund request wizard. Steps:
  select-payment → amount + refund_type → reason + reason_note → refunded_to →
  review. Payment selector uses ComboBox (never Select — payment list may be
  long). Refund type step filters options by entitlement (Small = full only;
  Medium+ unlocks partial + prorated). Prorated step embeds `proration-preview`
  widget with the computed refund_amount visible before submission.
- `approve.screen.json` — approver-facing approve action modal. Renders the full
  refund detail summary (frozen values) + inline notes field + confirm/cancel
  buttons. Segregation-of-duties guard — refuses to render the approve button
  when the current user is the initiator (shows a "You cannot approve your own
  refund request" panel instead).
- `reject.screen.json` — approver-facing reject action modal. Requires
  rejection_reason (256 char, customer-visible) + optional internal notes. Same
  segregation-of-duties guard as approve.

### `resources/refund-line/`

Admin-only. Only rendered when the parent refund is in status IN ('pending',
'awaiting_approval', 'approved') AND the tenant holds refund_partial or
refund_prorated entitlement.

- `editor.screen.json` — partial/prorated refund line editor. Two modes: partial
  (line-by-line selection of invoice lines with per-line amount inputs; live
  sum-validation ensures Σ line_amounts == parent refund.amount_cents) +
  prorated (single line with embedded proration-preview widget; computed
  refund_amount populates the line amount).

### `resources/refund-pending-approvals/`

Approver-facing dashboard.

- `queue.screen.json` — real-time pending-approvals queue. Sorted by
  initiated_at ASC (oldest first — surfaces SLA-approaching approvals). Per-row:
  refund summary + hours_pending badge (colour-coded — green < 12h, yellow
  12-24h, red > 24h) + inline approve/reject buttons. Auto-refreshes via
  tenant.{id}.refunds.pending-approvals broadcast channel — no polling.

### `resources/refund-report/`

Finance/admin/marketing-facing report.

- `refund-volume.screen.json` — per-tenant refund volume rollup. Period selector
  (7d / 30d / 90d / custom). Metric cards: total initiated, total succeeded,
  total refunded amount, avg approval-to-success duration, clawback rate.
  Sparklines for daily counts + amounts. Reason distribution donut chart.
  Provider distribution donut chart. Top-refunded invoices table. CSV export
  button (dispatches GenerateCouponUsageReportJob equivalent synchronously for
  the requested range).

### `widgets/`

- `refund-status-chip.widget.json` — composite chip showing (status + optional
  provider_error indicator + optional requires_approval indicator). Colour +
  icon + text label. Never colour-alone. Priority order: 'Failed' > 'Provider
  error' > 'Rejected' > 'Cancelled' > 'Succeeded' > 'Processing' > 'Approved' >
  'Awaiting approval' > 'Pending'.
- `reason-picker.widget.json` — ComboBox for selecting refund reason (with
  audience-based filtering — customer path shows customer-allowed set only;
  admin shows full set). Displays reason display_name + tooltip with regulator
  relevance. Loads from `data/reason-catalog.json`.
- `proration-preview.widget.json` — live proration preview for prorated refunds.
  Given a payment + cancellation date, renders the computed refund_amount + a
  breakdown (unused_period_start/end, unused_days, unused_pass_credit,
  base_refund_amount). Read-only — computed via compute_proration helper.

## Notes on `ComboBox` over `Select`

Every picker in this module uses HeroUI `ComboBox`. Rationale: the payment list
for a customer with many purchases may be long (60+ payments in a year for a
regular gym member); the invoice line list for partial refunds may be dense (15+
lines on a big-order invoice); the reason picker has 10 values but tooltip-rich
options benefit from filterable search. `Select` is deliberately NOT used
anywhere here.

## Financial redaction

Every screen that surfaces confidential financial fields (amount_cents,
currency, provider_fee_reversal_cents) checks the caller's
`refunds.view-financials` permission before rendering. Fields render as `••••`
when redacted. Customer variants show the customer's own amounts (which are
public to the customer) but hide provider_fee_reversal_cents (competitive info)

- any admin-only metadata.

## Segregation of duties surfacing

The approve.screen.json + reject.screen.json check the current user against
refund.initiated_by_user_id at render time. When they match, the modal shows a
"You cannot approve your own refund request" panel instead of the approve
button. This mirrors the RefundPolicy::approve enforcement — the SDUI just
surfaces the outcome cleanly.

## Real-time updates

Every screen that shows refund status subscribes to the appropriate broadcast
channel:

- Customer refund detail → `customer.{customerId}.refunds`
- Admin refund detail → `tenant.{tenantId}.refunds`
- Pending-approvals queue → `tenant.{tenantId}.refunds.pending-approvals`

Auto-refresh via broadcast eliminates polling — refund state changes surface
within seconds of the state transition.

## Approval workflow surfacing

The pending-approvals queue is the load-bearing surface for the approval
workflow. It surfaces:

1. Hours pending (colour-coded — green < 12h, yellow 12-24h, red > 24h
   approaching SLA).
2. Trigger reason (amount threshold / staleness / always-approve reason).
3. Assigned approvers (from metadata.approval_notification — who received the
   approval-required notification).
4. Segregation-of-duties guard (initiator visible; approve button hidden when
   current user is initiator).

## Marketing-bridge surfacing

Refunds with a linked marketing conversion event render a "Marketing reversal"
pill in the refund detail view. Clicking the pill deep-links to the
marketing::MarketingEvent rollup filtered to the campaign that originally
generated the payment. Enables marketing/finance cross-team visibility on "which
campaigns generate the most refund-worthy purchases".

## Prorated-refund UX

The proration-preview widget is the load-bearing UX for prorated refunds. Given
a payment + cancellation date, it renders:

- Total period: 365 days (annual membership)
- Days used: 90
- Days remaining (unused): 275
- Base refund: $451.37 (275/365 × $600)
- Used passes: 5 × $5 = -$25 (penalty)
- Unused passes: 15 × $5 = +$75 (credit)
- Final refund amount: $501.37

The widget makes the arithmetic visible — customers understand exactly why
they're getting the amount they're getting, reducing support tickets around "why
is my refund less than I expected".

## Empty states

- **Refund list empty (admin)** — "No refunds yet. Refunds appear here once
  customers request them or you initiate one." CTA: create button (respects
  refund_capture entitlement).
- **Refund list empty (customer)** — "No refunds yet." CTA: link to
  payments/mine if the customer has payments to potentially refund.
- **Pending-approvals empty** — "All caught up! No refunds are pending
  approval." (Positive empty state — approver-friendly.)
- **Report period empty** — "No refunds initiated over the reporting period."
  Suggests widening the period.
- **Refund detail — orphan finalization** — When refund.status='succeeded' but
  credit_note_id IS NULL, renders a warning banner: "Finalization is pending —
  the credit note is being created. Refresh in a minute or contact support if
  this persists."

## Non-goals

- **No "hypothetical refund" preview endpoint UI.** The customer-facing UI shows
  the maximum refundable amount inline (via GET
  /payments/{payment}/refundable-amount) but does NOT preview the full refund
  side effects (credit note, transaction, clawbacks). Those materialize on
  succeeded transition — previewing them would leak internal implementation.
- **No "refund preview" via SDUI for admin-initiated bulk refunds.** Bulk refund
  is CLI-only in v1 (refund_bulk_processing entitlement) — no SDUI UX for it.
- **No "cancel while processing" UI.** Once a refund enters processing state,
  the state machine is one-way — the cancel button is hidden on any refund past
  'approved'.
