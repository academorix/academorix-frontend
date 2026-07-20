# growth/referrals — Phase 3 implementation status

## Status: SCAFFOLDED — every Action returns `null`; program CRUD + reward issuance pending

## What landed

- Blueprint-emitted models: `ReferralProgram`, `Referral`, `ReferralReward`,
  `ReferralRedemption`.
- Column-constant `Contracts/Data/*Interface` for each aggregate
  (auto-generated).
- Enum types (`ReferralRewardType`, `ReferralProgramStatus`, etc.).
- `#[AsRepository]` repositories (CRUD auto-provided).
- Migrations for all four tables, factories, permission seeder.
- Blueprint-emitted Action stubs — every one returns `null`.

## What's pending

### Actions to complete

- **`CreateReferralProgramAction`** (POST `/referral-programs`) — admin CRUD.
  Configures the reward-per-referral policy (`fixed_amount_cents` or
  `percent_of_first_order` or `plan_upgrade`), the eligibility window, the max
  redemptions per referrer.
- **`UpdateReferralProgramAction`** / `DeleteReferralProgramAction` /
  `ShowReferralProgramAction` / `ListReferralProgramAction` — CRUD closure.
- **`ActivateProgramAction`** (POST `/referral-programs/{id}/activate`) — flip
  `is_active`. Only one program can be active at a time per (tenant,
  program-type); the observer refuses concurrent actives.
- **`EnrollReferralAction`** — POST `/referrals/enroll`. The referrer's outbound
  link generation endpoint. Issues a short-code + persists a `Referral` row
  (status=pending).
- **`TrackReferralAction`** — POST `/public/referrals/track`. Public route
  (rate-limited). Records the referral click; when the referred user signs up,
  the row's status flips to `signed_up`.
- **`ConvertReferralAction`** — internal. Fires when the referred user's first
  paid conversion lands. Routes through `ReferralRewardIssuer` — mints a coupon
  via `finance/coupon::CouponIssuer::issueForReferral()` (already implemented —
  commit `35e0b722e`).
- **`ListReferralAction`** / `ShowReferralAction` — per-tenant read.
- **`ListRedemptionAction`** — GET `/referrals/{id}/redemptions`.
- **`ClaimRewardAction`** — POST `/referral-rewards/{id}/claim`. The referrer's
  claim endpoint.
- **`ReportAction`** — GET `/referrals/reports`. Per-program performance
  (attempts, conversions, rewards issued).

### Services to complete

- **`ReferralCodeGenerator`** — 8-char alphanumeric collision- checked short
  code. Blueprint scaffold only.
- **`ReferralRewardIssuer`** — the write-path that fires when a referred user
  converts. Routes to `CouponIssuer::issueForReferral`.
- **`ReferralValidator`** — validates a claim: referrer eligible, reward not
  already claimed, program still active, within claim-window.
- **`ReferralReporter`** — per-tenant + per-program rollups.

### Events

- **`ReferralEnrolled`** — referrer created a link.
- **`ReferralConverted`** — referred user signed up + paid.
- **`ReferralRewardIssued`** — coupon minted.
- **`ReferralRewardClaimed`** — referrer redeemed the reward.

### Cross-module dependencies

- **`finance/coupon::CouponIssuer::issueForReferral`** — ALREADY IMPLEMENTED
  (commit `35e0b722e`). Referral reward-issuance routes through it.
- **`identity/user`** — the referrer's identity + referred-user identity FKs.
- **`notifications/notifications`** — every event has a notification consumer.
- **`growth/attribution`** — a referral link carries an implicit UTM
  (`utm_medium=referral`, `utm_source=<referrer_id>`).

## Backlog priorities

1. **P0 — `EnrollReferralAction` + `TrackReferralAction`** — enables the
   referrer's link generation + tracking.
2. **P0 — `ConvertReferralAction` + `ReferralRewardIssuer`** — closes the
   money-side loop.
3. **P1 — program CRUD** — admin needs to configure programs.
4. **P1 — `ClaimRewardAction`** — referrer surface.
5. **P2 — `ReportAction` + `ReferralReporter`** — admin analytics.
