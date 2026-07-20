# membership — changelog

## [Unreleased] — inception (Wave 4)

- Membership module authored with FOUR owned aggregates:
  - `Membership` (`mbr_`) — the customer's paid subscription contract with the
    academy. Belongs to Tenant + Region + Branch + Athlete. References
    MembershipPlan.
  - `MembershipPlan` (`mbp_`) — per-branch SKU catalog (name, price, currency,
    billing_interval, pass_grant_config, refund_policy).
  - `MembershipRenewal` (`mbn_`) — append-only per-period audit; carries
    attempt_number + payment_intent_id + terminal status.
  - `Pass` (`pss_`) — per-session admission credit issued on activation + each
    renewal; consumed by session check-in.
- Nine entitlement gates:
  - `membership_capture` (master, Small+).
  - `membership_plan_slot` (Small=5 / Medium=25 / Enterprise=∞).
  - `membership_slot` — capacity via plan.max_active_members.
  - `membership_trial_periods` (Medium+).
  - `membership_multi_currency` (Medium+).
  - `membership_hard_cancel_prorated_refund` (Enterprise).
  - `membership_gift_memberships` (Enterprise).
  - `membership_addon_management` (Medium+).
  - `membership_extended_retention` (Enterprise — 7y → 10y).
- Membership state machine: pending → active → {paused ⇄ active} → {cancelled |
  lapsed | refunded | expired}.
- Renewal retry ladder: attempt #1 at next_renewal_at → +3d → +7d → +14d →
  lapsed.
- Dunning notification cadence: 24h / 72h / 7d after each failed attempt.
- Load-bearing invariants:
  - **Atomic invoice creation** — Membership.creating fires
    CreateInvoiceOnMembershipCreated hook in the same DB transaction. Rollback
    on either side aborts both. Enforced by the
    `atomic_membership_invoice_creation` rule.
  - **Frozen snapshots** — `price_snapshot_cents`, `coupon_snapshot`,
    `tax_calculation_snapshot` are immutable post-create. Plan price changes +
    mid-contract VAT changes never retroactively re-price existing memberships.
  - **One active membership per (tenant, athlete, plan)** via partial unique
    index.
  - **Pass consumption idempotence** — passes cannot be consumed twice;
    consuming outside valid_from/valid_until refused.
- Cancellation flows:
  - Soft cancel by-period-end (default) — no refund; membership stays active
    through the period.
  - Hard cancel + prorated refund (Enterprise) — computes unused-days refund;
    fires refund module.
- CRITICAL DISTINCTION documented throughout: `Membership` (customer's contract
  with academy) is NEVER conflated with `TenantSubscription` (academy's SaaS
  bill from Academorix). Different tables, different money flows, different
  retention regimes.
- Consumers gated on `subscription::TenantSubscription`-based feature toggles
  resolve entitlements via the tenant's TenantSubscription — memberships care
  about their tenant's Academorix SaaS plan when deciding whether to allow
  hard-cancel-with-refund.
- Cascade paths:
  - AthleteArchived / AthleteWithdrawn → cascade soft-cancel memberships (with
    `cascade=true` gate).
  - BranchArchived → refuse when active memberships exist.
  - MembershipPlanArchived → refuse when active memberships reference the plan.
  - TenantErased → cascade delete via FK; refund records survive in compliance
    archive.
- Retention: cancelled / lapsed / refunded / expired retain 7 years (SOX 404 +
  tax audit). Enterprise extended to 10 years via entitlement.
- 24 published events across membership + plan + renewal + pass lifecycles.
- 11 notification categories (transactional_required — payment + dunning are
  contract-critical, exempt from CAN-SPAM opt-out).
- Four broadcast channels: tenant / branch / athlete / user + one per-membership
  `membership.{id}.passes` for live pass-usage widgets.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`,
  `compliance`, `region`, `branch`, `athlete`, `athlete-guardian`, `tax`,
  `coupon`.
- Extended by NONE.
- Planned consumers: `invoice`, `transaction`, `payment`, `refund`,
  `chargeback`, `growth::marketing`, `growth::analytics`, `growth::referrals`.

### Design notes

- **The name game.** Every symbol in this module carries `Membership*` — never
  `Subscription*`. The word "subscription" is reserved for `TenantSubscription`
  in the sibling module. Docs + comments explicitly disambiguate.
- **Distinct from `TenantMember`.** `tenancy::TenantMember` is a person's User
  membership in a Tenant (tenant access). `finance::Membership` is a paid
  contract. Same English root, three different tables (§1b of hierarchy.md
  documents the third one — `teams::TeamMember`).
- **No `application_id` / `organization_id` / `scope_node_id` on any of the four
  tables.** Membership cascades application via
  `tenant_id → tenants.application_id`. Organization cascades via
  `branch → organization`. Memberships are not a config consumer.
- **`region_id` on memberships IS legitimate** — per hierarchy §14 belongs-to
  matrix. Memberships care about currency + tax rules which are Region-scoped.
  This is different from `region_id` on organizations (forbidden — orgs +
  regions are orthogonal).
- **Frozen snapshots are load-bearing for tax audit.** A 2024 VAT rate change
  never retroactively re-taxes a Q3 2023 membership. The snapshot preserves the
  calculation exactly as it was at signing.
- **PCI-DSS boundary.** Payment tokens live in the payment module. Memberships
  hold only pointer references. No PAN, no CVV touches this module.
- **Notifications are transactional.** Payment failure emails, cancellation
  confirmations, and lapsed notifications are contract-critical — CAN-SPAM
  Section 5(a)(5)(A) exempts transactional messages from opt-out. Marketing
  dunning (win-back emails after 30 days lapsed) is a separate growth-owned
  flow.

### ULID prefix registration

- `mbr_` (Membership) — new
- `mbp_` (MembershipPlan) — new
- `mbn_` (MembershipRenewal) — new
- `pss_` (Pass) — new

Register all four in
`modules/shared/blueprints/foundation/data/ulid-prefixes.json`. Verify no
collisions with pre-existing prefixes.

### Wave 4 → 4.5 migration notes

- Wave 4.5 lands the `invoice` module. Once shipped,
  `CreateMembershipInvoiceJob` becomes obsolete and
  `CreateInvoiceOnMembershipCreated` calls the invoice module directly.
- Wave 4.5 lands the `refund` module. Once shipped,
  `CalculateProratedRefundOnHardCancel` calls the refund module rather than
  emitting a stub event.
- Wave 4.5 lands the `chargeback` module. Once shipped, `MembershipChargedBack`
  events are consumed by chargeback dispute-lifecycle machinery.
- Wave 5 lands growth marketing consumers — lapsed-membership win-back campaigns
  key off `MembershipLapsed` events with an explicit consent-tier of `marketing`
  (not `transactional_required`).
