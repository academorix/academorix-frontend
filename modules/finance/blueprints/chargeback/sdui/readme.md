# chargeback — SDUI blueprints

## Surfaces

### `resources/chargeback/`

Admin-only tenant-facing surfaces. NO customer variant — chargebacks are bank-
initiated + card network rules prohibit surfacing chargeback state to customers
on most networks.

- `list.screen.json` — filterable card grid with per-chargeback status chip,
  network badge, reason-code chip, RDR-eligible/CE3-eligible indicators.
  Filters: status, network, reason_category, reason_code, provider,
  rdr_eligible, ce3_eligible, filed_at range, amount range. Approaching-deadline
  rows surfaced at top with hours-remaining badges.
- `detail.screen.json` — single chargeback detail view. Three tabs: Timeline
  (state transitions + notifications sent + webhook receipts), Evidence
  (all ChargebackEvidence submissions with completeness percent + provider
  response per attempt), and Details (amount + fees + parent payment link +
  parent invoice link + linked dispute + linked transactions + linked refund
  when RDR path). Confidential financial fields (amount_cents, fee_cents,
  provider_metadata) render as `••••` when caller lacks
  chargebacks.view-financials permission.
- `submit-evidence.screen.json` — admin-facing evidence submission wizard.
  Steps: review-auto-collected → invoice-evidence → receipt-evidence →
  service-documentation → refund-policy → communication-log → customer-
  signature-evidence → shipping-docs (optional) → uncategorized-text → review
  → submit. Each step is skippable if the auto-collected data is complete +
  the admin has reviewed it. PCI-DSS scan runs on every field on step
  transition (refuses PAN patterns immediately). CE3-eligible chargebacks
  additionally include a CE3.0 bundle step that shows the two prior legitimate
  purchases + matching identifiers.
- `accept.screen.json` — RDR-accept action modal. Renders the full chargeback
  detail summary + cost comparison (RDR path vs fight-and-lose) + inline notes
  field + confirm/cancel buttons. Only rendered when chargeback.rdr_eligible=
  true + status='pending_evidence' + tenant holds chargeback_rdr entitlement.

### `resources/chargeback-evidence/`

Admin-only. Rendered as a subresource of chargeback detail.

- `view.screen.json` — evidence submission history for a specific chargeback.
  Timeline view of every ChargebackEvidence row (submission_attempt_number
  ordered ASC), showing evidence completeness percent + submitted_by_user +
  submitted_at + provider_response outcome per attempt.

### `resources/chargeback-pending-evidence/`

Defenders' queue dashboard.

- `queue.screen.json` — real-time pending-evidence queue. Sorted by
  evidence_due_by ASC (soonest deadlines first — surfaces SLA-approaching
  chargebacks). Per-row: chargeback summary + hours-remaining badge (colour-
  coded — green > 168h / 1wk, yellow 24-168h, orange 3-24h, red < 3h) +
  auto-collected evidence completeness bar + inline submit-evidence + accept-
  via-RDR buttons. Auto-refreshes via tenant.{id}.chargebacks.pending-evidence
  broadcast channel — no polling.

### `resources/chargeback-rate-report/`

Finance/admin/marketing-facing report + merchant-account risk dashboard.

- `dashboard.screen.json` — per-tenant chargeback rate dashboard. Rolling
  60-day rate per network with VDMP/MDMP threshold reference lines (0.9%
  Visa, 1.5% Mastercard, 1.0% Amex/Discover). Threshold status per network
  (below / approaching / exceeded — colour-coded). Sparklines for daily
  chargeback counts + amounts + fees. Reason category distribution donut
  chart + reason code top 10 table. Provider distribution donut chart. RDR
  acceptance rate + CE3 submission rate cards. Median days-to-decision +
  win rate cards. CSV export button (dispatches GenerateMonthlyRateReportJob
  synchronously for the requested range). Rate-threshold-exceeded events
  surface as a live alert banner at top when active.

### `widgets/`

- `chargeback-status-chip.widget.json` — composite chip showing (status +
  optional RDR-eligible indicator + optional CE3-eligible indicator +
  optional overdue-evidence indicator). Colour + icon + text label. Never
  colour-alone. Priority order: 'Lost' > 'Expired' > 'Won' > 'Accepted refund'
  > 'Under bank review' > 'Evidence submitted' > 'Pending evidence'.
- `network-badge.widget.json` — Card network badge (Visa / Mastercard / Amex
  / Discover / etc.). Uses network-catalog.json for display metadata. Rendered
  as a small chip with network logo (from a shared logos asset).
- `reason-code-picker.widget.json` — ComboBox for selecting or displaying
  a reason code with tooltip showing full description + category +
  dispute_time_limit. Loads from `data/reason-code-catalog.json`. Read-only
  in most surfaces (chargebacks are bank-initiated; reason_code is frozen at
  creation).
- `evidence-completeness-indicator.widget.json` — progress bar (0-100%)
  showing how many of the 8 evidence fields (invoice_evidence / receipt_
  evidence / service_documentation / refund_policy / communication_log /
  shipping_docs / customer_signature_evidence / uncategorized_text) are
  populated. Colour-coded: red < 50%, yellow 50-80%, green > 80%. Rendered
  inline on pending-evidence queue rows + evidence-submission wizard step
  transitions.

## Notes on `ComboBox` over `Select`

Every picker in this module uses HeroUI `ComboBox`. Rationale: the reason-code
list has 40+ entries with tooltip-rich options that benefit from filterable
search; the network list has 8 entries but tenants may want to search by name
during report filters. `Select` is deliberately NOT used anywhere here.

## Financial redaction

Every screen that surfaces confidential financial fields (amount_cents,
fee_cents, provider_metadata, provider_reference_id) checks the caller's
`chargebacks.view-financials` permission before rendering. Fields render as
`••••` when redacted.

## Evidence PII redaction

Every screen that surfaces customer_signature_evidence (IP address, device
fingerprint hash, signature URL), service_documentation (attendance records,
coach signatures), or shipping_docs checks the caller's
`chargebacks.view-evidence` permission before rendering. Fields render as
`••••` when redacted. Some support roles hold chargebacks.view but NOT
chargebacks.view-evidence — those roles see the chargeback list + detail
tabs BUT NOT the evidence bundles.

## No customer-facing UI

There are NO customer-facing chargeback surfaces. The customer files with
their bank + interacts with their bank about the dispute. Some card networks
(most notably Visa) explicitly prohibit surfacing chargeback state to the
customer through the merchant's product surface. The only exception is the
RDR path — when a chargeback is accepted via RDR, the customer sees a REFUND
confirmation (via the refund module's customer-facing UI) framed as 'your
dispute has been resolved' — NOT a chargeback surface.

## Real-time updates

Every screen that shows chargeback status subscribes to the appropriate
broadcast channel:

- Admin chargeback detail + list → `tenant.{tenantId}.chargebacks`
- Pending-evidence queue → `tenant.{tenantId}.chargebacks.pending-evidence`
- Rate-report dashboard → `tenant.{tenantId}.chargebacks.rate-alerts`

Auto-refresh via broadcast eliminates polling — chargeback state changes
surface within seconds of the state transition.

## Approaching-deadline surfacing

The pending-evidence queue is the load-bearing surface for the evidence-
defense workflow. It surfaces:

1. Hours remaining until evidence_due_by (colour-coded — green > 1wk, yellow
   1wk-1d, orange 1d-3h, red < 3h approaching miss).
2. Auto-collected evidence completeness percent (progress bar).
3. Reason code + reason category (indicates defense strategy).
4. RDR-eligible + CE3-eligible flags (indicates cheapest/best defense paths).
5. Inline submit-evidence + accept-via-RDR buttons (one-click actions).

## RDR cost-comparison surfacing

The accept.screen.json (RDR-accept modal) surfaces a cost comparison table
showing the four paths (RDR path / fight-and-win / fight-and-lose / expired-
auto-loss) with associated costs (money loss + network fee + rate impact).
Educates admin on why RDR is the cheapest path for low-value disputes.
Reads data/rdr-configuration.json for the numbers.

## Rate-threshold banner

The rate-report dashboard shows a persistent alert banner at top when ANY
network's rolling rate exceeds its VDMP/MDMP threshold. Banner is colour-coded
(yellow at 75-99% of threshold, red at 100%+) + includes actionable
recommendations (RDR enrollment, fraud review, refund policy update).
Merchant-account termination risk if sustained — the banner is intentionally
prominent.

## Empty states

- **Chargeback list empty (admin)** — "No chargebacks. Your merchant account
  is in good standing — the lower this list, the better."
- **Pending-evidence empty** — "All caught up! No chargebacks are pending
  evidence submission." (Positive empty state — defender-friendly.)
- **Rate-report empty** — "No chargebacks in the reporting period. Rate is
  0% across every network."
- **Evidence submission wizard — no auto-collected data** — "Auto-collection
  did not find matching data. Please enter evidence manually or contact
  support for assistance."
- **Chargeback detail — orphan terminal** — When chargeback.status IN
  ('lost', 'expired') but transaction_id IS NULL, renders a warning banner:
  "Finalization is pending — the offsetting transaction is being recorded.
  Refresh in a minute or contact support if this persists."

## Non-goals

- **No customer-facing chargeback UI.** Card network rules prohibit surfacing
  chargeback state to customers on most networks.
- **No 'preview chargeback outcome' UI.** Chargebacks are bank-decided;
  previewing the outcome would leak internal decision logic that doesn't
  exist (we can't predict bank decisions).
- **No admin-initiated chargeback filing.** Chargebacks are customer-initiated
  via their bank + provider-webhook-driven. Merchants can only defend.
- **No bulk-evidence-submission UI.** Every chargeback requires case-by-case
  evidence review. Bulk operations would degrade evidence quality + win
  rates.
- **No 'chargeback prediction' UI.** Fraud detection lives in the payment
  module at capture time (prevents chargeback-generating payments upstream).
  This module records the outcome; it doesn't predict it.
