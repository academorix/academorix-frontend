# athlete-guardian — changelog

## [Unreleased] — inception (Wave 3a)

- AthleteGuardian module authored. One owned entity:
  - `AthleteGuardian` (`agu_` prefix) — pivot between Athlete + User with
    relationship + role flags.
- Two entitlement gates:
  - `athlete_multi_guardian` (Medium+; enables >1 guardian per athlete for
    split-family scenarios).
  - `athlete_guardian_verification` (Enterprise-only; HR-verified workflow with
    signed-document upload).
- Guardian lifecycle: pending → verified (auto-household OR hr-manual OR
  silent-acceptance) → optionally disputed → resolved or revoked (terminal).
- Load-bearing invariant: one is_primary=true per (tenant_id, athlete_id) when
  any active guardian exists. Enforced by partial unique index +
  AthleteGuardianObserver + ReconcilePrimaryGuardianInvariantJob.
- Four independent role flags: has_legal_custody + can_pickup +
  can_receive_communications + can_authorise_medical_care. Every flag change
  fires a dedicated event.
- Cross-field invariants: can_authorise_medical_care=true requires
  has_legal_custody=true (enforced by observer + valid_guardian_role_flags
  rule).
- Cascade paths: Athlete hard-delete → CASCADE (guardian rows go with the
  athlete); User soft-delete → RESTRICT (via
  PreventUserArchiveWithActiveGuardianship hook); GuardianRemoved when primary →
  auto-elect new primary.
- Verification workflow: `VerifyGuardianByEmailDomainJob` runs on GuardianAdded,
  attempts auto-household, falls back to silent-acceptance (24h) OR stays
  pending (Enterprise).
- Retention: verified/pending/disputed guardians co-terminous with parent
  Athlete; revoked guardians 7 years; soft-deleted 7 years post-delete.
- 12 published events. Six notification categories.
- Three broadcast channels: tenant / athlete / user.
- SDUI: 3 screens (list nested under athlete + add + edit) + 3 widgets
  (guardian-picker / guardian-role-flags / verification-badge).
- Three scheduled jobs (VerifyGuardianByEmailDomain / ReconcilePrimary /
  PurgeArchived).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `branch`, `user`, `entitlements`, `athlete`.
- Extended by NONE. Planned consumers: athlete-enrollment, finance,
  notifications, safeguarding, communications.

### Design notes

- No `application_id` / `organization_id` / `region_id` / `branch_id` /
  `scope_node_id` on guardian rows. All cascade or forbidden.
- AthleteGuardian.athlete_id + user_id + tenant_id are IMMUTABLE post-create.
  Re-pointing is audit launder.
- Guardian rows are polymorphic-adjacent — they bind two aggregates (Athlete +
  User) but are NOT themselves polymorphic (the shape is stable).
- The `guardian` role is INTRODUCED by this module (via the rbac RoleDefinition
  catalogue reference in permissions.json).
- Consent recording for minor athletes chains through ConsentDelegationChain
  resolver — invoked by athlete::consent_recorded_by_authorised_guardian rule
  (Wave 3a soft-warn; Wave 3b hard-fail via config toggle).

### ULID prefix registration

- `agu_` (AthleteGuardian) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`. 3-char
  lowercase.

### Wave 3a → 3b migration notes

- Config toggle `athlete.consent.enforce_guardian_authorisation` flips true —
  the athlete-consent rule hard-fails on consent recorded by non-authorised
  guardians.
- The AthleteEnrollment sibling module lands + starts consuming primary guardian
  for provisional-enrollment approval.
