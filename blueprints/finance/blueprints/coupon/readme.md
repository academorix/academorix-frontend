# coupon

Discount code + redemption tracker. Wave 4 finance-tier module that turns
tenant-authored promo codes into invoice-line discounts. Sits alongside
`finance::tax` (which computes tax on line items) — this module answers the
specific question **"what discount applies to this invoice line, and how many
times has this coupon been used?"**.

Data plane: 2 owned tables — `coupons` (the discount config) and
`coupon_redemptions` (the per-use pivot). Feeds `finance::invoice` (Wave 4) at
invoice-creation time and fires marketing events to `growth::marketing` for
ad-network attribution on referral-issued codes.

## 1. What this module owns

| Concern                          | Owned artefact                                                                                                                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discount configuration           | `Coupon` — per-tenant discount code: code string, name, description, discount_type + discount_amount (interpretation depends on type), applicability + applicable_plan_ids, usage_cap + per_customer_limit, valid_from + valid_until, is_stackable, issuance_source + issuance_context.            |
| Per-use pivot                    | `CouponRedemption` — one row per successful redemption: polymorphic customer (User / Athlete), polymorphic applied_to (Membership / Invoice / Transaction), source_amount_cents + discount_amount_cents + final_amount_cents (frozen at redemption time), discount_snapshot (frozen coupon config). |
| Atomic redemption                | `CouponRedeemer::redeem()` runs a single DB transaction with `SELECT ... FOR UPDATE` on the coupon row. Validates active window + usage_cap + per_customer_limit + applicability under the row lock, inserts the redemption, increments the coupon.usage_count.                                    |
| Marketing bridge                 | Every `CouponRedeemed` event fires a downstream `marketing::MarketingEvent` for ad-network attribution when the coupon carries `issuance_source='referral'` or `issuance_source='marketing_campaign'`.                                                                                              |
| Finance bridge                   | `finance::invoice` (Wave 4) calls `CouponRedeemer::redeem()` inside the invoice-creation transaction to apply the discount to a line item. Rollback on the invoice write rolls back the redemption via the shared transaction.                                                                     |
| Referrals bridge                 | `growth::referrals` (Wave 5) calls `CouponIssuer::issueForReferral()` to produce a coupon code when a `ReferralReward.status` transitions to `vested` with `reward_type='percent_discount'` or `reward_type='fixed_amount'`.                                                                        |
| Clawback semantics               | `finance::RefundIssued` / `ChargebackFiled` on an invoice with a redeemed coupon cascades a clawback: reverse the redemption + decrement coupon.usage_count + fire `CouponClawbackCompleted`.                                                                                                       |

### 1.1 The two owned tables

- `coupons` — per-tenant discount config. Belongs to `Tenant`. UNIQUE
  `(tenant_id, code)` partial WHERE `deleted_at IS NULL AND valid_from <= NOW()
  AND (valid_until IS NULL OR valid_until >= NOW())` — one ACTIVE coupon per
  code per tenant (allows re-issue after expiry).
- `coupon_redemptions` — per-use pivot. Belongs to `Tenant` + `Coupon`.
  Polymorphic customer (User / Athlete) + polymorphic applied_to (Membership /
  Invoice / Transaction). UNIQUE `(tenant_id, coupon_id, customer_type,
  customer_id, applied_to_type, applied_to_id)` — prevents double-redeem of the
  same coupon on the same target.

Neither carries `application_id`, `region_id`, `organization_id`, `branch_id`,
or `scope_node_id` — all cascade through `tenant_id` per `tenancy-columns.md`
§5. Coupons are operational finance data, not scope-consumer configuration.

## 2. Tier gating

Coupon capture is on every tier — the module unlocks progressively.

- **Small** — `coupon_capture` on. 10 active coupon slots, simple types only
  (`percent_discount` + `fixed_amount` + `free_shipping`), NO bulk issue, NO
  stackable (one coupon per invoice), 7y retention.
- **Medium** — Adds 100 active coupon slots, advanced discount types
  (`free_period` + `first_month_free` + `bogo`), bulk issue for campaign
  codes, 7y retention.
- **Enterprise** — Unlimited active coupon slots, stackable coupons (multiple
  coupons per invoice with defined precedence), extended retention (7y -> 10y
  for regulated tenants).

Entitlement keys:

- `coupon_capture` (boolean, all tiers) — master feature gate.
- `coupon_slot` (slot; Small=10, Medium=100, Enterprise=null) — active coupon
  cap.
- `coupon_bulk_issue` (boolean, Medium+) — bulk campaign codes.
- `coupon_advanced_discount_types` (boolean, Medium+) — bogo + free_period +
  first_month_free.
- `coupon_stackable` (boolean, Enterprise) — allow multiple coupons per invoice.
- `coupon_extended_retention` (boolean, Enterprise) — 7y -> 10y.

## 3. The redemption lifecycle

```
                    invoice/membership module composes an invoice line
                                    │
                                    ▼
                CouponValidator.canRedeem(coupon, customer, target, source_amount)
                     — pure read; may be called pre-checkout for preview
                                    │
                                    ▼
                CouponRedeemer::redeem(coupon, customer, target, source_amount)
                     — enters the INVOICE-CREATION transaction:
                                    │
                                    ▼
                        SELECT ... FOR UPDATE ON coupons
                                    │
                                    ▼
                validate active window (valid_from <= now < valid_until)
                validate usage_count < usage_cap
                validate per-customer redemptions < per_customer_limit
                validate applicability (plan matches, minimum order met)
                                    │
                                    ▼
                INSERT INTO coupon_redemptions (freeze discount_snapshot)
                UPDATE coupons SET usage_count = usage_count + 1
                                    │
                                    ▼
                       fire CouponRedeemed (after commit)
                                    │
                                    ▼
                    marketing::CaptureCouponRedeemedMarketingEvent
                                    │
                                    ▼
                       return final_amount_cents to caller

    On refund / chargeback later:
        finance::RefundIssued -> ProcessCouponClawbackJob
        UPDATE coupon_redemptions SET reversed_at, clawback_reason
        UPDATE coupons SET usage_count = usage_count - 1
        fire CouponClawbackCompleted
```

Refusal paths (transaction rolls back):

- `CouponRedemptionRefused` with reason `COUPON_EXPIRED` / `COUPON_INACTIVE` /
  `COUPON_USAGE_CAP_REACHED` / `COUPON_CUSTOMER_LIMIT_REACHED` /
  `COUPON_APPLICABILITY_MISMATCH` / `COUPON_MINIMUM_ORDER_NOT_MET`.

Terminal states on `CouponRedemption` (via `reversed_at` on the row): active
(reversed_at IS NULL), reversed (reversed_at IS NOT NULL). No status column —
the reversal path is a soft-reversal that preserves the ledger for audit.

## 4. Atomic redemption — the load-bearing invariant

The check "is this coupon still valid AND has this customer not already
redeemed AND has program cap not exceeded" happens under a `SELECT ... FOR
UPDATE` row lock on the coupon record. This prevents the classic
double-redemption race where two concurrent checkouts both read
`usage_count = usage_cap - 1` and both proceed.

Enforced by:

1. `CouponRedeemer::redeem()` opens a transaction, acquires the row lock,
   runs every validation, inserts the redemption, increments the counter,
   fires `CouponRedeemed` **after commit** (via
   `ShouldDispatchAfterCommit`).
2. The composite unique index `(tenant_id, coupon_id, customer_type,
   customer_id, applied_to_type, applied_to_id)` on `coupon_redemptions` is
   the second line of defense — even if the row lock is bypassed (e.g. bug in
   a future caller), the unique constraint refuses the duplicate write.
3. `CouponObserver.updating (usage_count)` refuses writes where the new value
   exceeds `usage_cap` (returns `COUPON_USAGE_CAP_EXCEEDED`, a P1 signal
   because it means the redeemer's guard leaked).

The metric `academorix.coupons.atomicity.failures_total` should stay at 0.

## 5. Discount type semantics

Six discount types map to six computation shapes. `CouponValidator` selects
the shape from `coupons.discount_type`:

| Type                 | `discount_amount` interpretation                                           | Frozen in `discount_snapshot`         |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------- |
| `percent`            | Decimal 0..1 (0.25 = 25%). Applied to `source_amount_cents`.               | discount_type, discount_amount        |
| `fixed_amount`       | Cents. Deducted flat. Refuses when `source < discount_amount`.             | discount_type, discount_amount, currency |
| `free_period`        | Days (1..365). Only for Membership/subscription targets — extends period.  | discount_type, discount_amount (days) |
| `first_month_free`   | No `discount_amount` — waives the first period fee on a new Membership.    | discount_type                         |
| `bogo`               | No `discount_amount` — buy-one-get-one on eligible plans.                  | discount_type, applicable_plan_ids    |
| `free_shipping`      | No `discount_amount` — zeroes the shipping component of the invoice line.  | discount_type                         |

Small tier: `percent`, `fixed_amount`, `free_shipping`.
Medium+: adds `free_period`, `first_month_free`, `bogo`.

`CouponRedemption.discount_snapshot` is IMMUTABLE — frozen at redemption
time. Later edits to the parent `Coupon` never retroactively alter historical
redemptions.

## 6. Applicability filters

Not every coupon applies to every invoice line. `coupons.applicability` is one
of:

- `any` — applies to any invoice line.
- `membership_only` — applies only when `applied_to_type = Membership`.
- `specific_membership_plans` — applies only when the target Membership uses
  a plan in `applicable_plan_ids`.
- `minimum_order_value` — applies only when `source_amount_cents >=
  minimum_order_amount_cents` in the matching currency.

Applicability is checked under the row lock inside `CouponRedeemer::redeem()`.
Refusal fires `CouponRedemptionRefused` with the appropriate reason code.

## 7. Issuance sources

Coupons originate from five sources — the `issuance_source` column records
the origin for audit + downstream event routing:

- `manual` — admin created via UI / API / CLI. Default.
- `referral` — created via `growth::referrals` when a `ReferralReward.status`
  transitioned to `vested` with a discount-type reward. `issuance_context`
  carries `{ referral_program_id, referral_id, reward_id }`.
- `marketing_campaign` — created via bulk issue for a named campaign.
  `issuance_context` carries `{ campaign_name, campaign_id }`.
- `import` — created via CSV import (batch migration from a competing product
  or one-off campaign import).
- `api` — created via a tenant-authored automation (not the admin UI).

Downstream routing:

- `manual` + `marketing_campaign` fires `CouponIssuedManually`.
- `referral` fires `CouponIssuedByReferralProgram` + notifies the referrals
  module to progress the referral state.
- `import` fires `CouponIssuedManually` with `imported=true` in the payload.

## 8. Redemption is NEVER exposed over public HTTP

There is deliberately no `POST /api/v1/coupons/redeem` endpoint. Every
redemption happens as an **internal service call** inside the invoice /
membership module's own transaction:

```php
// finance::invoice — inside CreateInvoiceAction::execute()
$redemption = $this->couponRedeemer->redeem(
    coupon: $coupon,
    customer: $customer,
    appliedTo: $invoice,
    sourceAmountCents: $line->amount_cents,
);
$line->applyDiscount($redemption);
```

Reasons:

1. **Replay attacks** — a public POST would let a caller repeatedly submit
   the same coupon to enumerate valid codes / trigger cap-reached events.
2. **Atomic invoice consistency** — the redemption row must exist in the same
   transaction as the invoice line it discounts. A public POST would create
   a redemption row that could reference an invoice that later rolls back.
3. **Cross-module coordination** — the invoice module knows the line's tax
   context, the target type, and the applied plan. The coupon module can't
   guess these from a public request payload without duplicating invoice
   logic.

The customer plane instead exposes `GET /coupons/validate/{code}` (pure
validation — never touches the DB counter) and `POST /coupons/{code}/preview`
(computes the hypothetical discount for a proposed cart — also read-only).

## 9. Marketing event fanout

`CouponRedeemed` fires a downstream `marketing::MarketingEvent` when the
coupon's `issuance_source` implies a conversion attribution surface:

- `issuance_source='referral'` -> `Referral Coupon Redeemed` marketing event
  routed to the ad networks that seeded the underlying referrer.
- `issuance_source='marketing_campaign'` -> `Campaign Coupon Redeemed`
  marketing event tagged with the campaign_name for per-campaign ROAS.
- `issuance_source='manual'` / `import` / `api` -> no marketing event.

Reversal events on `CouponClawbackCompleted` fire the corresponding reversal
marketing events (see `marketing.json`).

## 10. Retention

- `coupons` — while active + 7 years post-expiry (SOX financial-record
  retention).
- `coupon_redemptions` — 7 years post-`redeemed_at` (financial audit — every
  redemption is a discount that reduced revenue).
- `TenantErased` — FK CASCADE hard-deletes both tables EXCEPT redemptions
  attached to invoices that survive tenant deletion (financial-obligation
  retention). Redemptions archived via `MigrateRedemptionsToArchiveOnTenantErased`
  to `compliance_archive.coupon_redemptions` prior to cascade.

Enterprise tier extends the 7y windows to 10y via `coupon_extended_retention`.

## 11. Cascades

- `finance::RefundIssued` on an invoice with a redeemed coupon ->
  `ProcessCouponClawbackJob` -> reverse the redemption + decrement
  `coupons.usage_count` + fire `CouponClawbackCompleted`.
- `finance::ChargebackFiled` -> same, higher severity.
- `membership::PlanArchived` for a plan referenced in
  `coupons.applicable_plan_ids` -> `CascadeCouponsOnMembershipPlanArchived`
  removes the archived plan from the array; if it was the only plan, the
  coupon transitions to `is_active=false` and fires `CouponDeactivated` with
  reason `applicable_plan_archived`.
- `growth::referrals::ReferralRewardVested` with a discount reward type ->
  `IssueCouponOnReferralRewardVested` -> creates a `Coupon` with
  `issuance_source='referral'`.
- `user::UserErased` (as the redemption customer) ->
  `RedactCouponRedemptionsOnUserErasure` redacts customer identity on
  redemptions 90 days post-erasure; row survives for the 7-year audit trail.
- `tenancy::TenantErased` -> FK CASCADE hard-deletes coupons +
  non-invoice-linked redemptions. Invoice-linked redemptions archive.

## 12. What this module does NOT do

- **No public POST /redeem endpoint.** Redemption is an internal service call
  inside the invoice/membership transaction.
- **No stackable-by-default.** One coupon per invoice unless the tenant holds
  `coupon_stackable` (Enterprise). Stackable coupons apply in
  `discount_type` precedence order: `first_month_free` -> `bogo` ->
  `percent` -> `fixed_amount` -> `free_shipping` -> `free_period`.
- **No ML-based fraud detection.** Standalone coupons rely on `usage_cap` +
  `per_customer_limit` + `coupon.rate_limit` middleware (10 attempts / IP /
  hour on POST /coupons/{code}/preview). Referral-issued coupons inherit
  `growth::referrals::FraudDetector` guarding.
- **No cross-tenant coupon sharing.** A coupon code is scoped to a tenant.
  Two tenants can independently define `SUMMER25` without collision.
- **No coupon transfers.** A coupon issued to user A cannot be redeemed by
  user B when `applicability=user_scoped` (a future variant — not shipped in
  v1). Current v1 model: coupons are code-scoped, not user-scoped.
- **No `application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id` on any owned row.** All cascade through `tenant_id`.

## 13. Cross-references

- `hierarchy.md` §1b + §7 — finance module vocabulary + tier matrix.
- `tenancy-columns.md` §3 + §5 — coupon tables carry `tenant_id`; NEVER
  `application_id` / `region_id` / `organization_id` / `scope_node_id`.
- `growth-and-observability.md` — coupon redemption fires marketing events
  for referral-attributable coupon codes.
- `modules/growth/blueprints/referrals/` — the sibling module. Referrals
  can issue coupons via `CouponIssuer::issueForReferral()` when a reward
  vests with a discount-type reward.
- `modules/finance/blueprints/tax/` — the sibling module. Tax computation
  runs on the `final_amount_cents` after coupon discount is applied.

## 14. ULID prefixes owned

- `cpn_` (Coupon) — new.
- `crd_` (CouponRedemption — Coupon ReDemption) — new. Distinct from `rcd_`
  (referrals::ReferralCode).

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

Consumed (referenced via FK): `ten_`, `usr_`, `app_`, `rcd_` (referral code
FK when `issuance_source='referral'`), `mev_` (marketing event downstream),
`inv_` (invoice — Wave 4), `mem_` (membership — Wave 4), `txn_`
(transaction — Wave 4), `plan_` (membership plan — Wave 4).
