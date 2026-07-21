# finance/membership — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Terminology guard (see hierarchy.md §1c)

> **`Finance\Membership` is the parent's paid subscription enrolling an athlete
> on a plan** (renewing money contract). Do NOT confuse with
> `TenantSubscription` (the tenant's SaaS subscription to Stackra).

## Implementation plan

Memberships own the recurring-charge lifecycle for a per-athlete
subscription-to-a-plan. Each membership row:

- Points at a `MembershipPlan` (defined once per tenant).
- Points at an `Athlete` (the beneficiary).
- Points at a paying `User` (the parent — may differ from the athlete).
- Carries a status: `trial | active | past_due | canceled | expired`.
- Renews on a cadence (`monthly` / `quarterly` / `yearly`).

### Actions to fill (18 total)

Standard CRUD + lifecycle:

| Action                        | Contract                                                          | Notes                                                                               |
| ----------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `CreateMembershipAction`      | `POST /api/v1/memberships`                                        | Delegates to `finance/order::CreateOrder + Checkout`.                               |
| `ShowMembershipAction`        | `GET /api/v1/memberships/{membership}`                            | Read-only.                                                                          |
| `ListMembershipAction`        | `GET /api/v1/memberships`                                         | Read-only.                                                                          |
| `UpdateMembershipAction`      | `PATCH /api/v1/memberships/{membership}`                          | Only mutable fields — never plan_id or start_date.                                  |
| `CancelMembershipAction`      | `POST /api/v1/memberships/{membership}/cancel`                    | End-of-period cancel by default; `immediate: true` opt-in.                          |
| `ReactivateMembershipAction`  | `POST /api/v1/memberships/{membership}/reactivate`                | For canceled memberships still inside their paid period.                            |
| `PauseMembershipAction`       | `POST /api/v1/memberships/{membership}/pause`                     | Suspend billing + entitlements for N days. Only allowed if plan.allow_pause = true. |
| `ResumeMembershipAction`      | `POST /api/v1/memberships/{membership}/resume`                    | Undo pause. Extends `renewal_at` by the pause duration.                             |
| `UpgradePlanAction`           | `POST /api/v1/memberships/{membership}/upgrade`                   | Body: `{ new_plan_id }`. Prorated charge for the difference, effective immediately. |
| `DowngradePlanAction`         | `POST /api/v1/memberships/{membership}/downgrade`                 | Body: `{ new_plan_id }`. Takes effect at next renewal (no prorating).               |
| `RenewMembershipAction`       | Queued job trigger only — cron dispatches `MembershipRenewalJob`. | Consumes payment. On failure → `finance/dunning`.                                   |
| `PlanListAction` / `PlanCrud` | `/api/v1/membership-plans/**`                                     | The plan catalogue — usually admin-only writes.                                     |

### Support services

- `MembershipProvisioner` (Services/) — creates membership after `OrderPaid`.
  Wires the initial `Pass` records.
- `MembershipRenewer` (Services/) — background job (per membership, scheduled at
  `renewal_at`) that charges the payment method + extends the period on success,
  dispatches `PaymentFailed` on decline.
- `MembershipEntitlementBridge` (Services/) — subscribes to
  `MembershipActivated` / `MembershipSuspended` / `MembershipCanceled` and calls
  `entitlements::Grant` / `Revoke`.

### Events

- `MembershipCreated`, `MembershipActivated`, `MembershipRenewed`,
  `MembershipPaused`, `MembershipResumed`, `MembershipUpgraded`,
  `MembershipDowngraded`, `MembershipCanceled`, `MembershipExpired`,
  `MembershipSuspended`.

### Coupon integration

At order creation: `Order::ApplyCoupon` reserves the coupon; at payment success
(`OrderPaid`), the coupon is committed by `CouponRedeemer::redeem` against the
membership's first invoice.

### Wallet integration

Members can pay from wallet credit — the order flow handles this via
`Order::PayFromCredit` when the credit covers the full amount.
