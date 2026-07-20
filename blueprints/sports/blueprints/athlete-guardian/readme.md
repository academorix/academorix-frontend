# athlete-guardian

Parent/legal-guardian pivot binding an Athlete to a User. Wave 3a foundational
domain module.

## 1. What this module owns

| Concern                   | Owned artefact                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guardianship link         | `AthleteGuardian` — pivot between Athlete + User with relationship + role flags (has_legal_custody, can_pickup, can_receive_communications, can_authorise_medical_care).                  |
| Primary guardian resolver | Exactly one `is_primary=true` per Athlete when any guardian exists. Auto-elects the first-added when the initial primary is removed.                                                      |
| Verification workflow     | `verification_status` enum (pending / verified / disputed / revoked). Auto-verified via `VerifyGuardianByEmailDomainJob` on same-household email domain match; else HR review.            |
| Role flags                | 4 booleans per guardian — legal custody, pickup, communications, medical authorisation. Independent of `is_primary` (a primary guardian isn't automatically the sole medical authoriser). |
| Consent delegation chain  | `ConsentDelegationChain` (invoked by athlete::consent_recorded_by_authorised_guardian rule) — resolves whether a given User has authorised guardianship for the minor athlete.            |
| Cascade to athlete        | Hard-deleted with the parent Athlete (CASCADE FK). Guardian rows have no meaning without their athlete.                                                                                   |

### 1.1 The one owned table

- `athlete_guardians` — pivot between `athletes` and `users` with the role
  flags + verification status. Carries `tenant_id` (CASCADE) + `athlete_id`
  (CASCADE) + `user_id` (RESTRICT).

None carry `application_id`, `organization_id`, `region_id`, `branch_id`, or
`scope_node_id`. All cascade or are inapplicable. Enforced by the
tenancy-compliance-auditor + observer refusal chains.

## 2. Tier gating

The `athlete_guardian.core` feature is available on every tier — every academy
managing minors needs guardian tracking. Tier gates apply to:

- **Small** — 1 guardian per athlete (`athlete_multi_guardian` off).
  Single-parent + single-guardian households only.
- **Medium** — multi-guardian split-family support (up to 4 guardians per
  athlete).
- **Enterprise** — unlimited guardians per athlete +
  `athlete_guardian_verification` HR-verified workflow.

Two entitlement keys:

- `athlete_multi_guardian` (boolean; Medium+ — enables >1 guardian per athlete
  for split-family scenarios)
- `athlete_guardian_verification` (boolean; Enterprise-only — HR-verified
  workflow with signed-document upload)

## 3. Guardian lifecycle

```
     (admin adds)
          │
          ▼
       pending ──(same-household detect  ──▶ verified ──▶ active guardianship
                  OR HR verify action)          │
          │                                      │
          │                                      └──(HR dispute)──▶ disputed ──(HR resolve)──▶ verified
          │                                                             │
          │                                                             └──(HR revoke)────────▶ revoked (terminal, non-blocking write path — the row stays for audit)
          │
          └──(30-day TTL past `athlete_guardian.verification.pending_ttl_days`)──▶ auto-revoke
```

The load-bearing invariant: **exactly one `is_primary=true` guardian per Athlete
when any active (`verification_status IN ('verified', 'pending', 'disputed')`
AND `deleted_at IS NULL`) guardian exists**. Enforced by:

1. Partial unique index on
   `(tenant_id, athlete_id, is_primary=true, deleted_at IS NULL)`. DB-level.
2. `AthleteGuardianObserver.updating` — refuses promotions that would violate;
   requires atomic swap via `/set-primary` route.
3. `ReconcilePrimaryGuardianInvariantJob` — nightly audit; every finding is a P1
   signal.

When the primary guardian is REMOVED (soft-delete), the observer auto-elects the
earliest-added remaining active guardian as the new primary + fires
`PrimaryGuardianChanged`.

## 4. Verification workflow

Guardian claims must be verified to prevent unauthorised access to a minor's
data. Three verification paths:

1. **Same-household auto-verify** — When the guardian's User.email domain
   matches the athlete's other verified guardian OR the tenant's staff-domain
   allow-list, `VerifyGuardianByEmailDomainJob` auto-transitions
   `pending → verified`. Fires `GuardianVerified` with
   `verified_by='auto_household'`.
2. **HR manual verify** — When the tenant carries
   `athlete_guardian_verification` entitlement, HR uploads a signed document
   (via storage::File, Wave 4+) + invokes `/verify`. Fires `GuardianVerified`
   with `verified_by='hr_manual'`.
3. **Silent acceptance** (Small + Medium without
   `athlete_guardian_verification`) — pending guardians auto-transition to
   verified after 24h of no HR dispute. Fires `GuardianVerified` with
   `verified_by='silent_acceptance'`.

Disputed guardians (`verification_status='disputed'`) BLOCK the row from acting
as consent recorder for athlete consents (the
`athlete::consent_recorded_by_authorised_guardian` rule refuses).

Revoked guardians (`verification_status='revoked'`) are terminal — the row stays
for audit but is treated as inactive across every downstream consumer.

## 5. Role flags

Four independent booleans:

- `has_legal_custody` — legal decision-making authority. Required for consent
  recording on medical + third-party disclosures.
- `can_pickup` — authorised to collect the athlete from sessions. Reception
  staff check this on session dismissal.
- `can_receive_communications` — receives session / enrollment notifications.
  Guardians with false get NO transactional emails (rare — usually set when a
  divorced parent's spouse is on the roster but not the day-to-day contact).
- `can_authorise_medical_care` — emergency medical decisions. Typically only
  guardians with `has_legal_custody=true`.

Every flag change fires a dedicated event (`GuardianCanPickupToggled` /
`GuardianCanReceiveCommunicationsToggled` /
`GuardianCanAuthoriseMedicalCareToggled`) so downstream consumers (reception
staff dashboards, medical clearance workflows) refresh their cached state.

## 6. Cascades

- `athlete::AthleteArchived` / `AthleteWithdrawn` / `AthleteGraduated` →
  guardian rows are UNAFFECTED (they stay for retention). Only Athlete
  hard-delete cascades to guardian rows.
- `user::UserSoftDeleted` → `PreventUserArchiveWithActiveGuardianship` refuses
  when the User is the only remaining guardian for a minor athlete (guardian
  handoff required first).
- `athlete::AthleteArchived` (cascade to enrollments handled in
  athlete-enrollment sibling; guardian rows unchanged).
- `tenancy::TenantErased` → cascade delete via FK.
- `GuardianRemoved` (soft-delete) with the guardian being `is_primary=true` →
  `ReleasePrimaryGuardianSlotOnGuardianRemoved` auto-elects a new primary +
  fires `PrimaryGuardianChanged`.

## 7. Retention

- Verified + pending + disputed guardians: co-terminous with parent Athlete.
- Revoked guardians: retained 7 years (audit — compliance requires visibility
  into revoked-guardian history).
- Soft-deleted guardians: 7-year retention from `deleted_at`, then hard-purge
  via `PurgeArchivedGuardiansJob`.
- Verification documents (Wave 4+ Storage integration): 7-year retention aligned
  with parent guardian row.

## 8. What this module does NOT do

- **User authentication / password reset for guardians.** That's the `user`
  module's job. The guardian's login flows are the same as any other User.
- **Guardian-to-guardian communication.** Deferred to Wave 5+ Communications
  module (this module doesn't own messaging).
- **Guardian ID document storage.** Verification documents are stored via
  `storage::File` (Wave 4+); this module just references the file ID +
  verified_by_user_id.
- **Custody schedule modelling.** A split-family may have alternating custody
  weeks; that scheduling belongs in a Wave 4+ Custody Schedule module. This
  module tracks WHO has legal custody, not WHEN.
- **Emergency contact.** The Athlete row carries emergency contact separately
  (see `athlete::schema.athlete.emergency_contact_*`). Emergency contact is a
  WHO-to-call-in-emergency; guardianship is a WHO-has-legal-authority. They're
  independent — some guardians aren't the primary emergency contact.
- **Age-verify guardian is adult.** The observer doesn't check the guardian's
  User.age (adults are trusted). If a bad actor lists a minor as a guardian, HR
  verification catches it.

## 9. Cross-references

- `hierarchy.md` §1a — AthleteGuardian canonical vocabulary; reject words
  (Parent, ParentLink, GuardianRow).
- `hierarchy.md` §14 — belongs-to matrix (AthleteGuardian → Tenant + User +
  Athlete).
- `tenancy-columns.md` §3 — every owned row carries `tenant_id` + `athlete_id` +
  `user_id`.
- `tenancy-columns.md` §5 — forbidden columns (never `application_id`,
  `organization_id`, `region_id`, `branch_id`, `scope_node_id` on guardian
  pivot).
- `modules/sports/blueprints/athlete/` — the parent athlete module. Guardian
  rows CASCADE-delete with their athlete.
- `modules/platform/blueprints/staff/` — the sibling wraps-user pattern. Staff
  wraps User; Guardian is a pivot BETWEEN Athlete + User.
- `modules/platform/blueprints/teams/team-members` — the polymorphic-resolver
  pattern is not repeated here (guardian is 1:1 with a User, not polymorphic).

## 10. ULID prefixes owned

- `agu_` (AthleteGuardian) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json` at merge time.

Consumed (referenced via FK): `ten_`, `ath_`, `usr_`, `fil_` (verification
document, Wave 4+).
