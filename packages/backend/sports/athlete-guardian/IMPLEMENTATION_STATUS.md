# sports/athlete-guardian — Phase 3 implementation status

## Status: PARTIAL — resolver + gate + provisioner DONE; Actions + observer pending

## What landed (commit `bdfa85bcf`)

### Services (real implementations)

- **`PrimaryGuardianResolver` + `Interface`** — three methods:
  `primaryFor` (lookup), `nextPrimaryFor` (deterministic tie-breaker
  for the "who takes over" question), `reassignPrimary` (atomic flip
  in a transaction). Enforces "exactly one primary per athlete".
- **`GuardianVerificationGate` + `Interface`** — capability truth
  table on a guardian row: `canRecordConsent`,
  `canAuthoriseMedical`, `canPickup`, `canReceiveCommunications`.
  All read-only, base gate = Verified + not revoked + not deleted.
- **`ConsentDelegationChain` + `Interface`** — `delegationFor`
  (single-row lookup), `authoritativeChain` (whole family), and
  `medicalRecorderUserIds` (family widget feeder).
- **`SameHouseholdDetector` + `Interface`** — sibling clustering via
  shared-guardian-User-id intersection. Powers sibling-discount
  rules + notification suppression.
- **`AthleteGuardianProvisioner` + `Interface`** — create-side
  orchestrator. Enforces uniqueness, verification bootstrap,
  exactly-one-primary, auto-primary for first row.

## What's pending

### Actions to complete

- **`CreateGuardianAction`** — POST /api/v1/athletes/{athlete}/guardians.
  Route through `AthleteGuardianProvisioner::provision()`. Rate limit:
  10/min per athlete. Emit `AthleteGuardianCreated`.
- **`UpdateGuardianAction`** — mutable fields: relationship, boolean
  flags (custody / pickup / comms / medical), notes. IMMUTABLE
  post-create: `user_id`, `athlete_id` — see the existing
  `GuardianUserIdImmutableException` / `GuardianAthleteIdImmutableException`.
- **`VerifyAction`** — POST /guardians/{guardian}/verify. Requires
  `guardians.verify` permission + `verification_document_file_id`.
  Transitions Pending → Verified. Emits
  `AthleteGuardianVerified`.
- **`RevokeAction`** — POST /guardians/{guardian}/revoke. Precondition:
  revoke_reason. If the guardian is the primary AND the athlete is a
  minor, must call `PrimaryGuardianResolver::nextPrimaryFor` and refuse
  when null (`GuardianAthleteWouldHaveNoPrimaryException`). Emits
  `AthleteGuardianRevoked`. When a next-primary exists, reassign in the
  same transaction.
- **`DisputeAction`** — POST /guardians/{guardian}/dispute. Transitions
  to Disputed with reason. Notifies platform admin for review.
- **`SetPrimaryAction`** — POST /guardians/{guardian}/set-primary.
  Route through `PrimaryGuardianResolver::reassignPrimary`.
- **`ListGuardianAction`** — GET /athletes/{athlete}/guardians. Render
  from `ConsentDelegationChain::authoritativeChain`.
- **`ShowGuardianAction`** — GET /guardians/{guardian}.
- **`DeleteGuardianAction`** — soft-delete. Same guardrails as Revoke.

### Observer

- **`AthleteGuardianObserver`** — enforce:
  - `user_id` immutable post-create.
  - `athlete_id` immutable post-create.
  - `is_primary = true` on more than one active row for the same
    athlete — refuse.
  - `revoked_at` set → dispatch `AthleteGuardianRevoked`.
  - `verification_status = Verified` → dispatch `AthleteGuardianVerified`.

### Jobs

- **`ReconcileGuardianVerificationJob`** — nightly sweep. Expire
  guardian rows whose verification document has expired or been
  invalidated.
- **`NotifyGuardianOfPendingVerificationJob`** — daily reminder to
  staff for Pending rows older than N days.

### Cross-module dependencies

- **`sports/athlete`** — the guardian-required check in
  `AthleteProvisioner` READS this module's repo. Landed together.
- **`identity/user`** — the guardian `user_id` FK check. Currently
  deferred (soft-check that the User row exists via
  `GuardianUserNotActiveException`).
- **`platform/storage`** — the verification-document file lives on the
  storage module's `files` table. Verify → link the file id.

## Backlog priorities

1. **P0 — Verify, Revoke, SetPrimary Actions** — the core lifecycle.
2. **P0 — AthleteGuardianObserver** — the defense-in-depth for the
   immutability invariants.
3. **P1 — Create + Update Actions** — needed by the FE guardian-add wizard.
4. **P2 — Dispute + Delete Actions**.
5. **P2 — Reconciliation jobs**.
