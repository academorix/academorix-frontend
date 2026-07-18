# referrals — changelog

## [Unreleased] — inception (Wave 5)

- Referrals module authored. Five owned entities:
  - `ReferralProgram` — per-tenant program configuration (reward, trigger, vesting, fraud thresholds, budget caps).
  - `ReferralCode` — the codes distributed by the program (user-scoped auto-issued, campaign, opaque).
  - `Referral` — the tracked referrer × referred × program × code instance with frozen attribution snapshot + device snapshot + fraud score.
  - `ReferralReward` — the reward record per side per referral. Vesting lifecycle: pending → vesting → vested → materialized → paid → (optionally) clawback.
  - `ReferralFraudFlag` — detection findings per referral. 9 flag types; 3 severities; 4 dispositions.
- Nine entitlement gates:
  - `referrals_capture` (all tiers) — master feature gate.
  - `referrals_program_slot` (slot; Small=1, Medium=5, Enterprise=∞).
  - `referrals_code_slot` (slot; campaign codes only — user codes always free).
  - `referrals_advanced_reward_types` (Medium+).
  - `referrals_double_sided` (Medium+).
  - `referrals_fraud_detection` (Medium+).
  - `referrals_program_budget_cap` (Medium+).
  - `referrals_manual_override` (Enterprise).
  - `referrals_extended_retention` (Enterprise; 7y → 10y).
- Referral state machine: pending_claim → claimed → signed_up → trigger_pending → vesting → vested → rewarded (terminal). Escape hatches: cancelled, expired, fraudulent.
- Reward state machine: pending → vesting → vested → materialized → paid (terminal). Escape hatches: cancelled, clawback.
- Atomic vesting: status → vested creates ReferralReward rows in the same DB transaction (one for single_sided, two for double_sided). Rollback aborts both sides. `academorix.referrals.atomicity.failures_total` should stay at 0.
- Cascade paths: `ReferralProgramArchived` → cancel non-terminal referrals + clawback unpaid rewards; `finance::RefundIssued` / `ChargebackFiled` → clawback path; `user::UserErased` (referrer) → cancel pending, retain paid with redacted recipient; `user::UserErased` (referred) → redact email 90d post-erasure; `tenancy::TenantErased` → FK CASCADE (paid > $600 migrates to compliance_archive).
- Fraud detection: rule-based (self-IP-match, device-fingerprint-match, disposable-email, self-email-variant, velocity-exceeded, click-storm-pattern, blacklist-domain, geographic-mismatch, behavioral-anomaly). Runs at claim time + trigger time. Every flag with severity IN (block, critical) fires ReferralFraudDetected (P1 signal to admin).
- Reward materialization: MaterializeVestedRewardsJob runs every 15 min. Bridges to Finance module (Wave 4) via `RewardMaterializer::materialize()` which creates a pending Credit + sets `finance_credit_id`.
- Attribution integration: every referral captures the `growth::attribution` snapshot at claim time. Frozen — never re-shapes on subsequent attribution changes. Downstream marketing events read it for ad-network conversion attribution.
- Marketing integration: `ReferralSignedUp` + `ReferralVested` fire marketing::MarketingEvent conversions. Reversal events on `ReferralCancelled` + `ReferralClawback` protect downstream ROAS.
- Nine notification categories (invitation-sent, claimed, signed-up, vested, rewarded, fraud-flagged, clawback, program-budget-alert, max-referrals-reached).
- Fraud detection ships 300+ disposable-email domains (data/disposable-email-domains.json).
- Five invitation templates (data/invitation-template-samples.json).
- 9 background jobs + 26 events + 5 observers + 5 policies + 14 commands + 3 middleware + 3 macros + 15 bindings.
- Real-time broadcasts: `tenant.{id}.referrals`, `user.{id}.referrals`, `referral-program.{id}.rewards`.
- SDUI: 4 program screens + 2 code screens + 2 referral screens + 2 reward screens + 2 fraud-flag screens + my-referrals user surface + invitation composer + 5 widgets.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `entitlements`, `compliance`, `attribution`, `marketing`.
- Extended by `finance` (Wave 4/5 — materializes vested rewards as pending credits; drives clawback on refund/chargeback) + `notifications` (delivers invitations + referral lifecycle notifications).
- Wave 5 inception release.

### Design notes

- No row carries `application_id` / `region_id` / `organization_id` / `branch_id` / `scope_node_id`. All cascade through `tenant_id`. Enforced by tenancy-compliance-auditor.
- Composite unique on `referrals` (tenant_id, referral_program_id, referrer_id, referred_id) partial WHERE deleted_at IS NULL — one referral per program per pair.
- Composite unique on `referral_rewards` (referral_id, recipient_role) partial WHERE deleted_at IS NULL — prevents double-materialization on retry.
- Composite unique on `referral_codes` (tenant_id, code) partial WHERE deleted_at IS NULL — one active code per tenant.
- `attribution_snapshot` on Referral is IMMUTABLE (observer refuses mutation).
- `reward_type` + `reward_amount` + `reward_currency` on ReferralReward are IMMUTABLE (observer refuses mutation).
- `first_touch` on the underlying attribution profile is IMMUTABLE (upstream module's contract).
- Wave 5 is the terminal growth-tier module for the initial platform. Wave 6+ may add: ML-based fraud detection, third-party affiliate networks (Impact / ShareASale / Rakuten), cascading commissions (out of scope for v1).
