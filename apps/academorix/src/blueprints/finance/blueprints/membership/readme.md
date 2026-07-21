# membership

The customer's paid subscription contract with the academy. Wave 4 finance
module.

## 1. The name collision that matters most

`Membership` and `TenantSubscription` share the English word "subscription" but
describe two entirely different money flows. Never conflate them.

| `finance::Membership`                                   | `subscription::TenantSubscription`                  |
| ------------------------------------------------------- | --------------------------------------------------- |
| The **parent pays the academy** — customer subscription | The **academy pays Stackra** — SaaS subscription |
| Renews on the academy's Stripe/Paddle account           | Renews on Stackra's Stripe/Paddle account        |
| Owns `Pass` credits per period                          | Owns `EntitlementLicense` rows per app              |
| Prefix `mbr_`                                           | Prefix distinct — Wave 1 pre-existing               |
| `belongsTo(Tenant, Region, Branch, Athlete)`            | `belongsTo(Tenant, Application)`                    |
| Lives in Finance module                                 | Lives in Subscription module                        |

A tenant might hold ten thousand Memberships (families paying for their kids)
AND exactly one TenantSubscription (the academy paying its Stackra bill). One
is retail; one is wholesale. They never share code paths.

## 2. What this module owns

| Concern              | Owned artefact                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| The contract         | `Membership` (`mbr_`) — links Athlete to a MembershipPlan; carries frozen price + tax + coupon snapshots; owns lifecycle         |
| The SKU catalog      | `MembershipPlan` (`mbp_`) — per-branch plan definitions (name, price, currency, billing_interval, pass grants, refund policy)    |
| The per-period audit | `MembershipRenewal` (`mbn_`) — append-only row per billing attempt; carries attempt_number + payment_intent_id + terminal status |
| The admission credit | `Pass` (`pss_`) — per-session admission that a membership period grants; consumed on session check-in                            |

### 2.1 The four owned tables

- `memberships` — carries `tenant_id` (CASCADE) + `region_id` (RESTRICT) +
  `branch_id` (RESTRICT) + `athlete_id` (RESTRICT) + `membership_plan_id`
  (RESTRICT) + optional `primary_guardian_id` + optional `coupon_id` + optional
  `tax_calculation_id`.
- `membership_plans` — carries `tenant_id` (CASCADE) + `branch_id` (RESTRICT) +
  optional `age_group_id` (RESTRICT).
- `membership_renewals` — carries `tenant_id` (CASCADE) + `membership_id`
  (RESTRICT) + optional `invoice_id` + optional `coupon_id`. Append-only (no
  soft-delete).
- `passes` — carries `tenant_id` (CASCADE) + `membership_id` (RESTRICT) +
  optional `consumed_by_session_id`.

None carry `application_id` (cascades through
`tenant_id → tenants.application_id`), `organization_id` (cascades through
`branch → organization`), or `scope_node_id` (memberships are not a config
consumer). `region_id` on membership is a legitimate direct FK per the hierarchy
§14 belongs-to matrix — memberships care about currency + tax rules which are
Region-scoped.

## 3. Tier gating

`membership_capture` is the master feature key. On every tier, but downstream
capability flags shape what a tier can do:

- **Small** — 1 tenant × 5 plans × ~50 active memberships. No trials, no
  multi-currency, no prorated refunds.
- **Medium** — 1 tenant × 25 plans × capped memberships. Trials, add-on
  management, multi-currency.
- **Enterprise** — unlimited plans + memberships. Hard-cancel + prorated
  refunds, gift memberships, extended retention (10y).

Nine entitlement keys govern the surface — see `entitlements.json`.

## 4. Membership lifecycle

```
                              MembershipCreated (with athlete + plan + coupon + tax snapshots)
                                       │
                              CreateInvoiceOnMembershipCreated (atomic — same transaction)
                                       │
                                pending  (Invoice created; awaiting Invoice.paid)
                                       │
                            Invoice.paid webhook / manual mark-paid
                                       │
                                       ▼
                                    active  (period bounds set; Passes issued for period 1)
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             ▼                         ▼                         ▼
       auto-renewal            admin action                admin action
       (next_renewal_at        (pause / resume)            (cancel — soft or hard)
         reaches now)                                             │
             │                                                    ▼
             ▼                                              cancelled (terminal after
       MembershipRenewal                                    cancellation_effective_at;
       created → attempt                                    if hard: prorated refund fired
       #1 → PaymentIntent                                   via refund module)
             │
     ┌───────┴────────┐
     ▼                ▼
   succeeded      failed_transient
     │                │
   period          RetryFailedRenewalJob
   extended;       (day+3, day+7, day+14)
   passes             │
   issued        ┌────┴────┐
   for next      ▼         ▼
   period      recovered   failed_permanent
              (→ succeeded (after attempt 3+)
              path)          │
                             ▼
                          lapsed (terminal;
                          remaining passes
                          expire immediately)

  active ─(expires_at reached — lifetime memberships never fire this)─▶ expired
  active ─(chargeback filed)─▶ status stays active but MembershipChargedBack fires;
                              chargeback module owns dispute lifecycle
```

## 5. Atomic invoice creation

The load-bearing invariant: when `Membership.status` transitions from unset to
`pending` on create, an `invoice::Invoice` row is created in the SAME DB
TRANSACTION with amount = frozen `price_snapshot_cents` + tax + coupon discount.
Rollback on either side aborts both.

Enforced by:

1. `CreateInvoiceOnMembershipCreated` hook — invoked on `Membership.creating`
   (pre-commit). Opens a DB transaction if not already inside one; creates the
   Invoice; sets `membership.invoice_id` (via reverse-FK on the invoice row).
2. `MembershipObserver.creating` — refuses commit when the hook's Invoice create
   failed.
3. `atomic_membership_invoice_creation` rule — reasserts the invariant on
   `updating` so subsequent state transitions cannot lose their Invoice pointer.

## 6. Renewal state machine + dunning ladder

A `MembershipRenewal` row is created for each billing cycle by
`ProcessMembershipRenewalJob` (runs hourly). Its `attempt_number` progresses:

| Attempt | Fired by                      | Timing                  | On success                   | On transient failure                | On permanent failure |
| ------- | ----------------------------- | ----------------------- | ---------------------------- | ----------------------------------- | -------------------- |
| 1       | `ProcessMembershipRenewalJob` | at `next_renewal_at`    | extend period + issue passes | schedule attempt 2 at day+3         | mark lapsed          |
| 2       | `RetryFailedRenewalJob`       | 3 days after attempt 1  | same                         | schedule attempt 3 at day+7         | mark lapsed          |
| 3       | `RetryFailedRenewalJob`       | 7 days after attempt 2  | same                         | schedule attempt 4 at day+14        | mark lapsed          |
| 4       | `RetryFailedRenewalJob`       | 14 days after attempt 3 | same                         | mark lapsed + fire MembershipLapsed | mark lapsed          |

Between attempts, `NotifyPaymentFailureJob` fires dunning emails at 24h / 72h /
7d marks after each failed attempt.

## 7. Cancellation flows

Two flavours, gated by tier:

- **Soft cancel (default)** — `Membership.cancel({ effective: 'period_end' })`.
  Sets `cancelled_at = now()`,
  `cancellation_effective_at = current_period_ends_at`,
  `next_renewal_at = null`. Membership stays `active` (and passes continue to
  work) through the period. On period end, `ExpireMembershipJob` transitions to
  `cancelled`. No refund.
- **Hard cancel with prorated refund (Enterprise)** —
  `Membership.cancel({ effective: 'immediately' })`. Refuses when tenant lacks
  `membership_hard_cancel_prorated_refund` entitlement. Sets
  `cancelled_at = now()`, `cancellation_effective_at = now()`. Immediately
  transitions to `cancelled`. Fires `CalculateProratedRefundOnHardCancel` hook —
  computes refund amount from unused-days share of `price_snapshot_cents` +
  calls the refund module. Remaining unconsumed Passes expire.

Refund policy on the plan (`refund_policy` enum) also gates this:

- `no_refund` — hard cancel disallowed regardless of tier
- `prorated` — hard cancel refunds unused days (requires Enterprise entitlement)
- `full_within_grace` — full refund if within `refund_grace_days` of contract
  signing
- `by_admin_approval` — no automatic refund; admin creates a manual credit memo

## 8. Snapshot semantics

Three fields are frozen at membership creation and never mutate:

1. **`price_snapshot_cents`** — copies `membership_plan.price_cents` at signing.
   Plan price changes do not retroactively re-price existing memberships.
2. **`coupon_snapshot`** — full JSONB copy of the coupon at redemption time
   (percentage / amount / expiry / restrictions). Coupon revisions or expiry do
   not affect a membership that already redeemed it.
3. **`tax_calculation_snapshot`** — full JSONB copy of the tax calculation at
   signing (jurisdiction / rate / base / breakdown). Mid-contract VAT changes
   never retroactively re-tax an existing membership.

Renewals FIRST recompute tax + coupon for the new period, then persist the FRESH
values on the new `MembershipRenewal` row. The Membership's snapshots stay
locked to the original signing.

## 9. Cascades

- `athlete::AthleteArchived` → `PreventPlanArchiveWithActiveMemberships` refuses
  when memberships reference the athlete (via a hook mirroring
  athlete-enrollment). `cascade=true` cancels memberships in one transaction
  (soft-cancel semantics).
- `athlete::AthleteWithdrawn` → cancels every active membership on that athlete
  via soft-cancel.
- `athlete::AthleteGuardianRemoved` (primary guardian removed) → membership
  stays active but `primary_guardian_id` set to null; admin notified to
  reassign.
- `branch::BranchArchived` → `PreventBranchArchiveWithActiveMemberships` refuses
  when active memberships reference the branch.
- `membership_plans::MembershipPlanArchived` →
  `PreventPlanArchiveWithActiveMemberships` refuses when active memberships
  reference the plan.
- `tenancy::TenantErased` → cascade delete via FK. Refund records + Invoice
  records survive in compliance archive (managed by compliance module).

## 10. Retention

- Active + paused memberships: never expire.
- Cancelled / lapsed / refunded / expired memberships: retained 7 years
  post-terminal for SOX 404 + tax audit. Enterprise extended to 10 years via
  `membership_extended_retention` entitlement.
- Membership plans: while active + 7 years post-archive.
- Membership renewals: 7 years (financial record, append-only).
- Passes: consumed → 7 years (audit); unused expired → 90 days.
- On `TenantErased`, refund records survive as compliance archive rows even
  after the membership is purged.

## 11. What this module does NOT do

- **Card storage.** Payment tokens live in the payment module (PCI-DSS scope).
  Memberships hold a `payment_method_id` pointer only — never PAN, never CVV.
- **Dispute lifecycle.** Chargeback module owns the dispute state machine.
  Membership fires `MembershipChargedBack` when a chargeback lands but doesn't
  manage the dispute.
- **Usage-based billing.** Invoice module handles metered add-ons. Membership
  only handles fixed-price recurring billing.
- **Invoice PDF rendering.** Invoice module owns the PDF.
- **Payment routing.** Payment module decides which gateway to use.

## 12. Cross-references

- `hierarchy.md` §1b — Membership vs TenantSubscription vocabulary; TenantMember
  is a THIRD unrelated aggregate.
- `hierarchy.md` §14 — belongs-to matrix (Membership → Tenant + Region +
  Branch + Athlete).
- `tenancy-columns.md` §3 + §5 — membership tables carry `tenant_id`; never
  carry `application_id`/`organization_id`/`scope_node_id`.
- `modules/finance/blueprints/tax/` — the tax_calculation source module.
- `modules/finance/blueprints/coupon/` — the coupon redemption source module.
- `modules/sports/blueprints/athlete/` — the parent athlete module.
- `modules/sports/blueprints/athlete-guardian/` — the guardian relationship
  module.
- `modules/sports/blueprints/athlete-enrollment/` — canonical style reference
  for state-machine + atomic-conversion patterns (Membership.creating →
  Invoice.create mirrors AthleteEnrollment → TeamMember atomically).

## 13. ULID prefixes owned

- `mbr_` — Membership
- `mbp_` — MembershipPlan
- `mbn_` — MembershipRenewal
- `pss_` — Pass

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

Consumed (referenced via FK): `ten_`, `reg_`, `brn_`, `ath_`, `agu_`
(AthleteGuardian), `cpn_` (Coupon), `txc_` (TaxCalculation), `inv_` (Invoice —
Wave 4 sibling), `pin_` (PaymentIntent — Wave 4 sibling), `ses_` (Session — Wave
3+), `age_` (AgeGroup for plan prerequisites), `usr_`.
