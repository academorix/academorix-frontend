# coupon — changelog

## [Unreleased] — inception (Wave 4)

- Coupon module authored. Two owned entities:
  - `Coupon` — per-tenant discount code with discount_type + discount_amount,
    applicability + applicable_plan_ids, usage_cap + per_customer_limit,
    valid_from + valid_until, is_stackable, issuance_source + issuance_context.
  - `CouponRedemption` — per-use pivot with atomic constraint check, frozen
    discount_snapshot at redemption time, polymorphic customer (User /
    Athlete) + polymorphic applied_to (Membership / Invoice / Transaction).
- Six entitlement gates:
  - `coupon_capture` (all tiers) — master feature gate.
  - `coupon_slot` (slot; Small=10, Medium=100, Enterprise=null).
  - `coupon_bulk_issue` (Medium+) — bulk campaign codes.
  - `coupon_advanced_discount_types` (Medium+) — bogo + free_period +
    first_month_free.
  - `coupon_stackable` (Enterprise) — allow multiple coupons per invoice.
  - `coupon_extended_retention` (Enterprise) — 7y -> 10y.
- Six discount types: `percent`, `fixed_amount`, `free_period`,
  `first_month_free`, `bogo`, `free_shipping`. Small tier limited to `percent` +
  `fixed_amount` + `free_shipping`.
- Four applicability filters: `any`, `membership_only`,
  `specific_membership_plans`, `minimum_order_value`.
- Five issuance sources: `manual` (default), `referral` (via
  `growth::referrals`), `marketing_campaign`, `import`, `api`.
- Atomic redemption: `CouponRedeemer::redeem()` opens a single DB transaction
  with `SELECT ... FOR UPDATE` on the coupon row. Validates active window +
  usage_cap + per_customer_limit + applicability, inserts the redemption,
  increments `usage_count`. Rollback of the surrounding invoice-creation
  transaction rolls back both. Metric
  `academorix.coupons.atomicity.failures_total` should stay at 0.
- No public `POST /redeem` endpoint. Every redemption is an internal service
  call inside the invoice/membership creation transaction. Public surface:
  `GET /coupons/validate/{code}` (validation, no counter change),
  `POST /coupons/{code}/preview` (compute hypothetical discount).
- Marketing bridge: `CouponRedeemed` fires downstream marketing events when
  `issuance_source IN ('referral', 'marketing_campaign')` for ad-network
  conversion attribution. Reversal events on `CouponClawbackCompleted`.
- Cascade paths: `finance::RefundIssued` / `ChargebackFiled` ->
  `ProcessCouponClawbackJob` reverses the redemption + decrements
  `coupons.usage_count`; `growth::referrals::ReferralRewardVested` (with
  discount reward type) -> `IssueCouponOnReferralRewardVested` creates a
  `Coupon` with `issuance_source='referral'`; `membership::PlanArchived` ->
  `CascadeCouponsOnMembershipPlanArchived` removes the archived plan from
  `applicable_plan_ids`; `user::UserErased` (as redemption customer) ->
  `RedactCouponRedemptionsOnUserErasure` 90d post-erasure;
  `tenancy::TenantErased` -> FK CASCADE (invoice-linked redemptions archive).
- Rate limit: `coupon.rate_limit` middleware (10 attempts / IP / hour) on
  `POST /coupons/{code}/preview` prevents brute-force code enumeration.
- Four notification categories (usage-cap-reached, expired, redeemed, clawback).
- Six discount types + applicability + code-format catalogs shipped as reference
  data.
- 5 background jobs + 14 events + 2 observers + 2 policies + 10 commands + 2
  middleware + 8 bindings.
- Real-time broadcasts: `tenant.{id}.coupons`, `tenant.{id}.coupon-redemptions`.
- SDUI: 4 coupon screens (list, create, edit, bulk-issue) + 2 redemption screens
  (list, reverse) + 1 report screen + 2 widgets (discount-type-chip,
  coupon-status-badge).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`,
  `compliance`, `tax`.
- Extended by `membership` (Wave 4 — reads applicable coupons during renewal
  charge), `invoice` (Wave 4 — resolves coupon discount inside invoice-creation
  transaction), `referrals` (Wave 5 — issues coupons on reward vesting when the
  reward type is discount-adjacent).
- Wave 4 inception release.

### Design notes

- No row carries `application_id` / `region_id` / `organization_id` /
  `branch_id` / `scope_node_id`. All cascade through `tenant_id`. Enforced by
  tenancy-compliance-auditor.
- Composite unique on `coupons` (tenant_id, code) partial WHERE
  `deleted_at IS NULL AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW())`
  — one ACTIVE coupon per code per tenant (allows re-issue after expiry).
- Composite unique on `coupon_redemptions` (tenant_id, coupon_id, customer_type,
  customer_id, applied_to_type, applied_to_id) — prevents double-redeem of the
  same coupon on the same target.
- `discount_snapshot` on `CouponRedemption` is IMMUTABLE (observer refuses
  mutation) — the coupon config is frozen at redemption time so later edits to
  the coupon never retroactively alter the redemption.
- `discount_type` + `discount_amount` on `Coupon` are IMMUTABLE once the coupon
  has any redemption — refuses with `COUPON_TERMS_LOCKED`.
- ULID prefix `cpn_` (Coupon) is new. `crd_` (CouponRedemption) is new and
  deliberately distinct from `rcd_` (referrals::ReferralCode) to avoid
  cross-module confusion.
- Wave 4 is the initial finance-tier release for coupons. Wave 5+ may add:
  user-scoped coupons (transferable to a specific user only), cross-tenant
  syndicated coupon codes (partnership programs), ML-based fraud detection on
  preview endpoint (currently rule-based rate limit only).
