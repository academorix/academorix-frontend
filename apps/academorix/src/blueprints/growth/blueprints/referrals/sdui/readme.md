# referrals — SDUI blueprints

## Surfaces

### `resources/referral-program/`

Tenant-facing admin surfaces. Owner + marketing + admin.

- `list.screen.json` — filterable card grid; program slot entitlement usage bar;
  status chip per row.
- `create.screen.json` — multi-step create wizard: basics -> reward -> vesting
  -> fraud -> eligibility -> confirm. Reward step pre-loads from
  `data/reward-type-catalog.json`; vesting step from
  `data/vesting-rule-catalog.json`.
- `edit.screen.json` — same steps as create, minus reward config (which is
  locked once any referral commits to the program).
- `analytics.screen.json` — program-detail analytics dashboard. Real-time
  counters (claims / signups / vested / rewarded / clawback), budget progress
  bar, top campaign codes, funnel drop-off, fraud flag rate.

### `resources/referral-code/`

- `list.screen.json` — filterable list of every code. Filters: program,
  code_type, owner, is_active, expires_before. Row actions: copy, deactivate.
- `generate.screen.json` — campaign / opaque code generation form. Cannot
  generate user_scoped codes here (auto-issued).

### `resources/referral/`

- `list.screen.json` — filterable referral ledger. Columns: referrer, referred,
  status chip, program, code, claimed_at, fraud_score. Filters: program, status,
  referrer, referred, has_fraud_flag, fraud_score threshold.
- `detail.screen.json` — one referral's full view. Timeline (claimed ->
  signed_up -> trigger_pending -> vesting -> vested -> rewarded) with vesting
  timeline widget. Attribution snapshot summary (utm, click_id). Fraud flag
  list + status. Reward list + amounts. Admin actions: cancel, force-vest
  (Enterprise).

### `resources/referral-reward/`

- `list.screen.json` — reward ledger. Filters: referral, recipient, role, type,
  status. Columns: recipient, role, type, amount, status chip, vesting timeline,
  materialized_at, paid_at, clawback path.
- `clawback.screen.json` — clawback confirmation modal / screen. Requires
  clawback_reason + notes. Financial reversal warning banner.

### `resources/referral-fraud-flag/`

- `list.screen.json` — fraud review queue. Default filter:
  disposition=unreviewed. Filters: severity, flag_type, referral. Row surface
  fraud-severity-chip + confidence bucket.
- `review.screen.json` — flag review detail. Evidence display (matched IPs /
  devices / emails — hashes only). Referral context. Disposition selector:
  confirmed_fraud / false_positive / manual_override_approved. Notes field.
  Cascade impact preview.

### `resources/me-referrals/` — user-facing

- `my-referrals.screen.json` — user's dashboard of their own referrals (as
  referrer) + rewards (as recipient). Share code + invitation composer
  prominent. Referral timeline per row. Reward status chips.

### `widgets/`

- `invitation-composer.widget.json` — the /me/invitations composer.
  Multi-recipient email input + channel toggle (email/SMS) + template selector +
  preview + send. Rate-limited display (X/100 daily).
- `program-picker.widget.json` — ComboBox for selecting a program. Filters to
  active programs by default. Powers create/edit code + admin referral filter.
- `reward-badge.widget.json` — visual reward summary (type + amount + currency +
  role). "$25 credit for referrer" or "10% off for both".
- `fraud-severity-chip.widget.json` — colour-coded chip for fraud severity +
  disposition combo.
- `referral-status-chip.widget.json` — colour-coded chip for the 10 referral
  statuses.
- `vesting-timeline.widget.json` — horizontal timeline visualising claimed ->
  signed_up -> trigger -> vesting -> vested -> rewarded with the current
  position highlighted + expected next transition.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox`. The user-picker (from the user module) is
re-used for referrer / referred / recipient selectors; this module owns the
`program-picker`, `code-picker` (embedded in referral list filter), and
reward-type-picker (embedded in create program).

## Attribution surfacing

The referral detail screen surfaces the frozen `attribution_snapshot` as an
inline expandable panel: first-touch card + last-touch card + click-ID pill
(Google/Meta/TikTok/Microsoft/Snapchat) + utm parameters. Never surfaces raw IP
or device — only hashed evidence tags for fraud flags.

## Marketing bridge surfacing

The referral detail screen shows a "Marketing conversion" badge when the
referral has fired a marketing event downstream. Clicking the badge deep-links
to the marketing::MarketingEvent row for cross-lane visibility.

## Fraud rendering

Fraud flags surface with severity + confidence prominently. Evidence hashes
render as truncated hex strings (e.g. `a1b2...c9d0`) not full 64-char SHA-256 —
the reviewer just needs the "matches other row X" signal, not the underlying
value.

## Minor-safeguarding

The user-facing my-referrals screen never surfaces the referred user's real-name
unless the current user has explicit permission. Otherwise: "your friend
joined". Prevents inadvertent disclosure.
