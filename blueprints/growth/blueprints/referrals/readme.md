# referrals

The viral-loop tracker. Wave 5 growth-tier module that turns every existing
tenant user into an attributable acquisition channel. Sits alongside
`growth::attribution` (which captures where signups came from) and
`growth::marketing` (which forwards conversions to ad networks) — this module
answers the specific question **"how did this signup / conversion come from an
existing user's invitation, and what reward does the referrer get?"**.

Data plane: 5 owned tables — `referral_programs`, `referral_codes`, `referrals`,
`referral_rewards`, `referral_fraud_flags`. Feeds `growth::marketing` on
completed referrals and `finance` (Wave 4) on vested rewards.

## 1. What this module owns

| Concern                    | Owned artefact                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Program configuration      | `ReferralProgram` — per-tenant program: reward type, amount, trigger event, vesting rule, fraud thresholds, eligibility rules, budget caps, program window.          |
| Distributed codes          | `ReferralCode` — user-scoped codes (`alice-a1b2c3`), campaign codes (`SUMMER25`), or opaque UUIDs. Per-code usage cap + expiry.                                      |
| Tracked referral instances | `Referral` — the referrer x referred x program x code row. Carries frozen `attribution_snapshot` (from `growth::attribution`) + `device_snapshot` + `fraud_score`.   |
| Reward records             | `ReferralReward` — one per side per program (referrer + optional referred). Vesting timeline (starts_at, completes_at, materialized_at, paid_at, clawback_at).       |
| Fraud detection            | `ReferralFraudFlag` — findings per referral. Types: self-IP-match, device-fingerprint-match, disposable-email, self-email-variant, velocity, click-storm, blacklist. |
| Attribution integration    | Every referral snapshots the `growth::attribution` context at claim time. Every referral conversion writes a `growth::marketing` event.                              |
| Atomic vesting             | Status -> vested atomically creates ReferralReward rows in the same DB transaction. Rollback on either side aborts both.                                             |
| Clawback semantics         | Refund / chargeback / fraud reversals cascade to reward status = clawback (materialized rewards reverse the Finance credit).                                         |

### 1.1 The five owned tables

- `referral_programs` — per-tenant program configuration. Belongs to `Tenant`.
  UNIQUE (tenant_id, slug) partial WHERE deleted_at IS NULL.
- `referral_codes` — the codes tenants distribute. Belongs to `Tenant` +
  `ReferralProgram`. Owner is polymorphic (user_scoped / campaign / opaque).
  UNIQUE (tenant_id, code) partial WHERE deleted_at IS NULL.
- `referrals` — the tracked instance. Belongs to `Tenant` + `ReferralProgram` +
  optional `ReferralCode`. Referrer + referred are polymorphic (user /
  anonymous_lead / lead). UNIQUE (tenant_id, referral_program_id, referrer_id,
  referred_id) partial WHERE deleted_at IS NULL — one referral per program per
  referrer-referred pair.
- `referral_rewards` — per-referral reward rows. Belongs to `Tenant` +
  `Referral`. Recipient polymorphic (user / lead). One row per role (referrer /
  referred) per referral.
- `referral_fraud_flags` — detection findings. Belongs to `Tenant` + `Referral`.
  Multiple flags per referral permitted.

None carry `application_id`, `region_id`, `organization_id`, `branch_id`, or
`scope_node_id` — all cascade through `tenant_id` per `tenancy-columns.md` §5.
Referrals is operational data, not a scope-consumer configuration.

## 2. Tier gating

Referrals capture is on every tier — the module unlocks progressively.

- **Small** — `referrals_capture` on. One program slot, single-sided rewards
  only, reward types limited to `percent_discount` + `fixed_amount`, NO fraud
  detection (rules are permissive), NO program budget cap, NO manual override.
- **Medium** — Adds 5 program slots, unlimited campaign codes, advanced reward
  types (`free_months`, `free_sessions`, `credits`, `point_award`), double-sided
  programs (reward both referrer + referred), rule-based fraud detection,
  program budget cap.
- **Enterprise** — Unlimited program slots, manual override (admin force-vest
  and admin fraud override), extended retention (7y -> 10y for financial audit
  alignment).

Entitlement keys:

- `referrals_capture` (boolean, all tiers) — master feature gate.
- `referrals_program_slot` (slot, per-tenant) — cap per tier.
- `referrals_code_slot` (slot, campaign codes only) — user codes always free.
- `referrals_advanced_reward_types` (boolean, Medium+).
- `referrals_double_sided` (boolean, Medium+).
- `referrals_fraud_detection` (boolean, Medium+).
- `referrals_program_budget_cap` (boolean, Medium+).
- `referrals_manual_override` (boolean, Enterprise).
- `referrals_extended_retention` (boolean, Enterprise).

## 3. The referral lifecycle

```
                    inbound click on referral link (?ref=alice-a1b2c3)
                                    │
                                    ▼
                    ReferralClaimer resolves program + code + captures
                    attribution snapshot + device snapshot
                                    │
                                    ▼
                        pending_claim (row inserted)
                                    │
                                    ▼
                    referred user reaches signup page
                                    │
                                    ▼
                              claimed
                                    │
                                    ▼
                    referred signs up successfully
                                    │
                                    ▼
                            signed_up
                                    │
                    trigger_event (program-configured) fires
                                    │
                                    ▼
                        trigger_pending
                                    │
                     VestingScheduler computes vesting_completes_at
                                    │
                                    ▼
                              vesting
                                    │
                     CheckReferralVestingJob (nightly) OR immediate
                                    │
                                    ▼
                               vested ──────────▶ ReferralReward rows created
                                    │              (atomic — same transaction)
                                    ▼
                   MaterializeVestedRewardsJob (every 15 min)
                                    │
                                    ▼
                             rewarded (Finance credits issued)

    ANY branch may transition to:
        cancelled (refund / chargeback / referred withdrew / manual admin / program archived)
        expired (referral row past claim TTL without signup)
        fraudulent (fraud flag with severity=critical OR admin confirmed_fraud disposition)
```

Terminal states: `rewarded`, `cancelled`, `expired`, `fraudulent`. No
transitions leave them.

## 4. Atomic vesting -> reward creation

The load-bearing invariant of this module. When `Referral.status` transitions to
`vested`, the observer creates the appropriate `ReferralReward` rows in the SAME
DB TRANSACTION. Program config determines shape:

- Single-sided: one ReferralReward for `recipient_role='referrer'`.
- Double-sided: two ReferralReward rows — one for each of `referrer` and
  `referred`.

Rollback on either side aborts both. Enforced by:

1. `ReferralObserver.updating (status=vested)` opens a transaction, resolves the
   program, and creates rewards atomically.
2. The unique index `referral_rewards_referral_role_unique` on
   `(referral_id, recipient_role)` partial WHERE deleted_at IS NULL prevents
   double-materialization on retry.
3. `MaterializeVestedRewardsJob` picks up `status=vested` rewards and dispatches
   to the Finance module. Every double-materialization attempt fires
   `REFERRAL_REWARD_DOUBLE_MATERIALIZATION` (P1 signal).

The metric `academorix.referrals.atomicity.failures_total` should stay at 0.

## 5. Attribution snapshot semantics

Every referral captures the `growth::attribution` context at CLAIM time (not
signup time). `attribution_snapshot` on the Referral row is IMMUTABLE. This
ensures:

- If the referrer's UTM later reshapes (fresh campaign visits), the historical
  referral row still reports the original acquisition source.
- If the referred user's session is later merged into an identified profile
  (Enterprise `attribution_merge`), the referral's snapshot is stable.
- Marketing rollups for "referrals attributed to Campaign X" query the frozen
  snapshot rather than the live attribution profile.

The `growth::marketing` listener on `ReferralSignedUp` + `ReferralVested` reads
`attribution_snapshot` and fires a marketing event with the exact same shape a
direct conversion would carry — so downstream ad networks see referrals as
first-class attributable conversions.

## 6. Fraud detection

`FraudDetector` runs at TWO points:

1. **At claim time** (before Referral row is committed) — computes an initial
   `fraud_score` (0..100). If > `program.fraud_config.hard_block_threshold`
   (default 90), the referral is REFUSED (row never inserted). If between
   `warn_threshold` (default 40) and `hard_block_threshold`, a
   `ReferralFraudFlag` row with severity=`warn` is created and the referral
   proceeds.
2. **At trigger time** (before status -> vesting) — re-computes with fresh
   signal (new device attempts, subsequent claims from same IP, self-payment
   loop patterns). Same threshold gating.

Fraud rules (all rule-based, no ML in v1):

- `self_ip_match` — referrer + referred share IP hash within 90d window.
- `device_fingerprint_match` — referrer + referred share device_fingerprint
  hash.
- `disposable_email` — referred email domain in known-disposable list (see
  `data/disposable-email-domains.json` — 300+ domains).
- `self_email_variant` — referred email is a plus-addressing variant of the
  referrer's email (e.g. alice@example.com + alice+ref@example.com).
- `velocity_exceeded` — referrer submitted > `max_referrals_per_hour` in the
  last 60 min.
- `click_storm_pattern` — > 10 claims from the same IP in 10 min without
  subsequent signups.
- `blacklist_domain` — referred email domain in tenant's block list.
- `geographic_mismatch` — referred IP geo differs from claim geo by > 5000km
  (VPN abuse signal — not a hard block, just a flag).
- `behavioral_anomaly` — heuristic combining several soft signals.

Every fraud rule is TENANT-CONFIGURABLE via `program.fraud_config` — a strict
tenant can raise `max_referrals_per_hour` for its VIP referrers, a permissive
one can lower it. Admin-reviewed flags with disposition = `false_positive` lower
the confidence for future flags on the same (referrer, referred) pair.

## 7. Reward vesting workflow

Program config determines the vesting timeline:

- `immediate` — `vested_at` = `trigger_event_at`. No hold window. Used for
  low-friction rewards like point_award.
- `trigger_plus_hold_days` — `vested_at` = `trigger_event_at + N days`. Common
  for cash-adjacent rewards where the tenant wants to observe the referred user
  for potential refund / churn before crediting.
- `after_refund_window_closes` — `vested_at` =
  `trigger_event_at + refund_window_days`. Aligns vesting with the Finance
  module's refund window.
- `n_events_completed` — vests after the referred user completes N of some event
  (e.g. 3 successful team practice attendances). Custom tracking via a
  domain-event listener.
- `manual_approval` — vests only when admin explicitly force-vests via
  `POST /referrals/{id}/force-vest`. Enterprise-only.

Once vested, `MaterializeVestedRewardsJob` (every 15 min) creates a pending
Finance credit (Wave 4) with `finance_credit_id` FK. Once the credit is issued
and the tenant pays out (or applies to subscription), `paid_at` sets and the
reward is terminal.

## 8. Clawback semantics

Rewards are reversible when specific downstream events fire:

- `finance::RefundIssued` on the referred user's first payment -> clawback.
- `finance::ChargebackFiled` on the referred user's first payment -> clawback.
- `ReferralFraudFlagObserver` sets disposition to `confirmed_fraud` -> parent
  Referral becomes `fraudulent` -> every reward on it clawbacks.
- `ReferralProgramArchived` cascades to unpaid rewards (materialized but not yet
  paid): clawback + reverse the Finance credit. Already-paid rewards are NOT
  clawed back (paid = terminal).

Clawback status transitions the reward row from `paid` / `materialized` to
`clawback` with `clawback_reason` recorded. The Finance module (Wave 4) is
responsible for the actual credit reversal on its side; the referrals module
just marks the local row and fires `ReferralClawback` for accounting.

## 9. Fraud flag review workflow

Admins can review flags via `POST /referral-fraud-flags/{flag}/review`. The
review sets `reviewed_at`, `reviewed_by_user_id`, and one of:

- `confirmed_fraud` — cascades: parent Referral -> `fraudulent`, cancel any
  pending rewards, clawback materialized rewards.
- `false_positive` — no cascade. The flag stays for audit but doesn't affect
  reward flow. Future flags on the same (referrer, referred) pair use lower
  confidence.
- `manual_override_approved` — allows the referral to proceed even though the
  flag exists. Admin explicitly accepts the risk. Audit-critical (recorded with
  reason).

Fraud reviews are compliance-relevant (7-year retention for the fraud audit
trail).

## 10. Retention

- `referral_programs` — while active + 7 years post-archive (every issued reward
  traces back).
- `referral_codes` — 7 years post-deactivation.
- `referrals` — 7 years (financial audit + tax audit alignment).
- `referral_rewards` — 7 years (tax audit).
- `referral_fraud_flags` — 7 years (fraud audit trail).
- `TenantErased` — cascade delete via FK EXCEPT paid rewards which migrate to
  the compliance archive (materialised financial records survive tenant deletion
  for legal-obligation retention).

Enterprise tier extends the 7y windows to 10y via
`referrals_extended_retention`.

## 11. Cascades

- `finance::RefundIssued` -> `ClawbackRewardsOnFinanceRefund` -> reverses any
  reward tied to the refunded payment.
- `finance::ChargebackFiled` -> `ClawbackRewardsOnFinanceChargeback` -> same,
  higher severity.
- `user::UserErased` -> `RedactReferralDataOnUserErasure` -> if referrer: cancel
  their pending referrals + retain paid rewards with subject redacted. If
  referred: redact `referred_email` on referrals and touchpoints.
- `tenancy::TenantErased` -> `PurgeReferralDataForErasedTenant` -> FK CASCADE
  hard-deletes every row (audit rows survive).
- `ReferralProgramArchived` -> `ArchiveReferralsOnProgramArchived` -> pending
  referrals cancel; materialized-not-yet-paid rewards clawback.

## 12. What this module does NOT do

- **No ML fraud detection.** v1 is rule-based only. Wave 5+ may add an ML
  classifier for `behavioral_anomaly`.
- **No third-party affiliate networks.** No Impact / ShareASale / Rakuten
  integration. That's a Wave 6+ commercial affiliate module.
- **No commission-only structures.** Rewards are flat + program-configured.
  Cascading commissions ("your referral's referral gives you 5%") is explicitly
  out — this is a flat referral model.
- **No sub-affiliates.** Referral graph is one hop deep. A referred user's
  future referrals are their own — the original referrer does not stack.
- **No paid-in-cash rewards.** All rewards flow through the Finance module's
  credit substrate. Direct fiat payouts (bank transfer, PayPal) are out of scope
  — always route through Finance.
- **No manual event insertion via API.** Referrals are captured via the
  attribution middleware + claim endpoint. Admins cannot POST "create a
  referral" arbitrarily (only campaign / user codes are admin-creatable).
- **No cross-tenant referrals.** A referral row's referrer and referred are
  always in the same tenant. Cross-tenant is a non-goal for the whole growth
  tier.
- **No `application_id` / `region_id` / `organization_id` / `branch_id` /
  `scope_node_id` on any owned row.** All cascade through `tenant_id`.

## 13. Cross-references

- `growth-and-observability.md` — the growth-tier vocabulary. Referrals is the
  viral-loop tracker; feeds marketing + finance.
- `hierarchy.md` §2 — where growth sits in the platform tree.
- `hierarchy.md` §7 — tier matrix (referrals unlock progressively).
- `tenancy-columns.md` §3 — every owned row carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns.
- `modules/growth/blueprints/attribution/` — the upstream feeder. Referrals
  reads `AttributionSnapshot` at claim time.
- `modules/growth/blueprints/marketing/` — the sibling downstream. Referral
  conversions fire marketing events for ad-network optimization.
- `modules/compliance/blueprints/consent/` — the consent registry the invitation
  flow gates through.

## 14. ULID prefixes owned

- `rpg_` (ReferralProgram) — new.
- `rcd_` (ReferralCode) — new.
- `ref_` (Referral) — new.
- `rrw_` (ReferralReward) — new.
- `rfr_` (ReferralFraudFlag) — new.

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

Consumed (referenced via FK): `ten_`, `usr_`, `app_`, `att_` (attribution FK),
`mev_` (MarketingEvent — the downstream conversion event).
