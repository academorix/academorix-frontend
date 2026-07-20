# membership — SDUI blueprints

## Surfaces

### `resources/membership/`

- `list.screen.json` — filterable membership table. Columns: athlete (with minor
  badge), plan, status chip, next_renewal_at (with days-until),
  lifetime_value_cents, primary_guardian. Filters: branch, plan, status,
  dunning-status, has-recent-chargeback. Grouped view option (by status). Header
  CTAs: "Submit membership", "Create plan", "Report".

### `resources/membership-plan/`

- `list.screen.json` — filterable plan catalog. Columns: plan name, price (with
  currency), billing_interval, passes_per_period, is_active toggle,
  current_active_members / max_active_members with capacity chip. Filters:
  branch, age_group, is_active, billing_interval. Header CTAs: "Create plan",
  "Start from template" (opens template picker driven by
  `data/plan-sample-templates.json`).

### `resources/membership-renewal/`

- `list.screen.json` — renewal history table. Columns: membership (with
  athlete + plan link), period_starts_at, attempt_number, status chip,
  total_amount_cents, next_attempt_at (for failed), failure_reason. Filters:
  status, membership_id, attempt_number. Group-by-membership option. Read-only —
  no CRUD affordances.

### `resources/pass/`

- `list.screen.json` — pass ledger. Columns: membership (with athlete link),
  pass_type, valid_from/valid_until, consumed_at, consumed_by_session (with
  deep-link), status (available/consumed/expired/refunded). Filters: membership,
  pass_type, status. Kiosk-mode enables one-tap consume.

### `resources/membership/report-dashboard.screen.json`

- Admin-facing revenue dashboard. Cards: MRR, ARR, active_membership_count,
  new_this_period, churned_this_period, dunning_open_count,
  trial_conversion_rate, dunning_recovery_rate. Chart panels: MRR trend (last 12
  months), churn breakdown (voluntary vs involuntary), plan performance
  leaderboard. Filters: branch, currency, period.

### `widgets/`

- `membership-status-chip.widget.json` — status chip with color variant per
  state (pending=warning, active=success solid, paused=neutral,
  cancelled=neutral, lapsed=danger, refunded=info, expired=neutral).
- `plan-picker.widget.json` — ComboBox-based plan selector for the membership
  signup form. Filterable by name. Shows price + billing_interval +
  passes_per_period per option. Hidden plans (is_active=false OR outside
  effective range OR at capacity) are excluded.
- `pass-badge.widget.json` — compact "N passes remaining" indicator with a
  smaller "expires DD/MM" subscript. Color coded (green >= 4, yellow 1-3, red
  0). Powers the parent-facing dashboard.
- `renewal-timeline.widget.json` — visual timeline showing renewal history for a
  membership. Each dot represents a MembershipRenewal — green (succeeded), red
  (failed_transient/permanent), yellow (attempting). Timeline extends to
  next_renewal_at with an "upcoming" marker.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox`. The athlete-picker (from athlete module) +
region-picker (from region module) + coupon-picker (from coupon module) are
reused; this module owns the plan-picker + billing-interval-picker +
refund-policy-picker.

## Entitlement affordances

The SDUI hides UI when the relevant entitlement is off:

- `membership.hard_cancel` off → cancel dialog shows soft-only radio;
  hard-cancel option hidden.
- `membership.trial_periods` off → plan-form's trial_days field hidden (or shown
  disabled with upgrade CTA).
- `membership.multi_currency` off → plan-form's currency dropdown locked to
  tenant's default region currency.
- `membership.addons` off → plan-form's addon section hidden.
- `membership.dunning_sms` off → settings screen's SMS-from-attempt field
  hidden.

## Dunning affordance

The membership detail page surfaces a dunning banner when
`consecutive_failed_renewal_count > 0`:

- Yellow banner at attempt 1 failure ("Payment failed — we'll retry in 3 days")
- Orange at attempt 2 ("Second payment attempt failed — please update your
  card")
- Red at attempt 3 ("Final attempt in 14 days — action required to avoid lapse")

Banner includes deep-link to payment-method update flow (Wave 4.5+ payment
module).

## PCI + safeguarding rendering

- Payment method preview (last 4 digits + card brand) rendered by payment module
  widget — never inline in this module's SDUI.
- Minor-athlete memberships show the minor-badge in every athlete cell.
- Cross-tenant platform admin view shows redacted athlete names (e.g. "A. K."
  not full names) for minor cases.

## The name-collision affordance

Because `Membership` shares nomenclature with `TenantSubscription` and
`TenantMember`, the SDUI displays subtle disambiguating chrome:

- Membership pages carry an icon + subtitle: "Customer subscription" (never
  plain "Subscription").
- TenantSubscription pages (subscription module) carry a different icon +
  subtitle: "SaaS billing" — that's a distinct module's SDUI.
- Never mix "Subscription" as a top-level nav label; use "Memberships" (this
  module) + "Billing" (subscription module).

## Cross-references

- `../data/plan-sample-templates.json` — plan starting points for the template
  picker.
- `../data/refund-policy-catalog.json` — refund_policy dropdown options +
  disclosure text.
- `../data/billing-interval-catalog.json` — billing_interval dropdown +
  interval_count multiplier UX.
- `../data/dunning-schedule-catalog.json` — dunning cadence visualisation on
  membership detail page.
