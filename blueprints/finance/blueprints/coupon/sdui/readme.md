# coupon — SDUI blueprints

## Surfaces

### `resources/coupon/`

Tenant-facing admin surfaces. Owner + marketing + admin.

- `list.screen.json` — filterable card grid; coupon slot entitlement usage bar;
  status badge per row; discount-type chip; issuance-source pill. Filters:
  status, discount type, applicability, issuance source, campaign name, expiry
  window.
- `create.screen.json` — multi-step create wizard: basics -> discount config ->
  applicability -> caps + limits -> validity window -> review. Discount step
  pre-loads from `data/discount-type-catalog.json` (filters advanced types by
  entitlement); applicability step from `data/applicability-catalog.json`.
- `edit.screen.json` — edits allowed fields (name, description, valid_until,
  usage_cap, per_customer_limit). Fields locked once a redemption exists
  (COUPON_TERMS_LOCKED) render as read-only with a lock icon.
- `bulk-issue.screen.json` — batch code generation for a named campaign.
  Code-template selector loads from `data/code-format-templates.json`; consumes
  `coupon_slot` entitlement per unit (refuses when count > remaining slots).
  Progress bar shows remaining slot capacity.

### `resources/coupon-redemption/`

- `list.screen.json` — full-tenant redemption ledger. Filters: coupon, customer,
  applied-to type/ID, reversed status, date range. Row surface customer chip +
  applied-to type badge + reversed pill (when set). Financial columns render
  only when the caller has coupons.view-financials permission.
- `reverse.screen.json` — reverse redemption confirmation modal. Requires
  clawback_reason + notes. Financial reversal warning banner. Shows the impact
  preview (which invoice line will be un-discounted, downstream Finance module
  note).

### `resources/coupon-report/`

- `report.screen.json` — weekly usage rollup dashboard. Sparklines for
  redemptions + total discount cents over the last 7d/30d/90d. Top campaign
  codes by redemption count. Per-issuance_source breakdown. Clawback rate. CSV
  export button (dispatches GenerateCouponUsageReportJob synchronously for the
  requested range).

### `widgets/`

- `discount-type-chip.widget.json` — colour-coded chip for the 6 discount types.
  Icon + text label. Small tier (percent / fixed_amount / free_shipping) renders
  in neutral variant; Medium+ types (free_period / first_month_free / bogo)
  render in accent variant when the tenant holds
  `coupon_advanced_discount_types` (or muted when they don't).
- `coupon-status-badge.widget.json` — composite badge showing (is_active, valid
  window, usage cap). Active + within window + under cap = success variant.
  Active + expired = danger + "Expired". Inactive = neutral + "Inactive". At cap
  = warning + "Cap reached". Combines the two axes (active state + usage state)
  into one glance.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox`. The customer picker (from the user module)
is re-used for customer selection in the reverse-redemption modal + the
redemption ledger filter. This module owns the `discount-type-picker` (embedded
in create), `applicability-picker` (embedded in create), and
`code-template-picker` (embedded in bulk-issue).

## Financial redaction

Every screen that surfaces confidential financial fields (discount_amount,
usage_cap, minimum_order_amount, source_amount_cents, discount_amount_cents,
final_amount_cents) checks the caller's `coupons.view-financials` permission
before rendering. Fields render as `••••` when redacted. The
`coupon-status-badge` widget avoids surfacing the raw cap — it renders "Cap
reached" or "23 / 100 used" only when the caller has permission.

## Rate-limit surfacing

The coupon list screen surfaces the tenant's current rate-limit consumption
(from settings.rate_limit_ip_per_hour) as an admin dashboard signal. Coupons
that trigger heavy validate/preview traffic (indicating enumeration attempts)
render a warn-severity chip alongside the row.

## Marketing-bridge surfacing

Coupons with `issuance_source IN ('referral', 'marketing_campaign')` render a
"Marketing conversion" pill in the coupon list + detail views. Clicking the pill
deep-links to the marketing::MarketingEvent rollup filtered to the campaign name
/ referral program.

## Minor-safeguarding

The redemption ledger never surfaces the raw customer name when
`customer_type='athlete'` AND the caller lacks explicit permission to view
athlete PII. Otherwise: "Athlete redemption" without identifying details.
Prevents inadvertent disclosure of minor customer identity to non-privileged
staff.

## Empty states

- **Coupon list empty** — "No coupons yet — launch your first campaign to reward
  loyal customers or attract new ones." CTA: create button (respects
  `coupon_slot` cap).
- **Bulk-issue disabled** — Small tier renders the bulk-issue button as an
  upgrade CTA: "Bulk issue codes for a campaign — available on Medium tier and
  above."
- **Redemption ledger empty** — "No redemptions yet." No CTA (redemption is
  internal, not admin-initiated).
- **Report empty** — "No coupons active over the reporting period." Suggests
  creating a coupon or extending an existing one.

## Coupon detail

The coupon detail view (a variant of list with a specific coupon selected — same
route, different query param `?selected=cpn_...`) shows:

- Coupon config summary (discount + applicability + caps + window) with lock
  icons on immutable-post-redemption fields.
- Real-time usage counter (broadcast via tenant.{id}.coupons channel).
- Redemption ledger filtered to this coupon (last 20 rows + link to full list).
- Marketing-bridge pill when issuance_source is referral/marketing_campaign.
- Admin actions: deactivate / extend / delete (delete disabled when redemptions
  exist).
