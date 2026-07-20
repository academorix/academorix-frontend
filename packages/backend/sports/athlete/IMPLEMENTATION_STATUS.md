# sports/athlete — Phase 3 implementation status

## Status: PARTIAL — write-side guardrails DONE; per-Action lifecycle bodies pending

## What landed (commit `c4122c178`)

### Services (real implementations, not stubs)

- **`AthleteProvisioner` + `AthleteProvisionerInterface`** — the ONE
  write-path seam. Every create/update runs through it. Enforces
  guardian coverage for minors, DOB bounds, medical-permission gate,
  consent-recorder authorisation, age-group snapshot resolution,
  and dispatches `AthleteCreated` inside the wrapping transaction.
- **`AthleteConsentGate` + `Interface`** — recorder-side
  authorisation gate. Adult path: self. Minor path: verified,
  custody-holding guardian. Rejects minor-recorder-for-minor edge
  cases via `UserIsMinorConsentRecorderException`.
- **`MedicalDisclosureGate` + `Interface`** — read-side gate for
  `medical_*` fields. Six-branch policy (auditor bypass / admin +
  consent / self + consent / guardian + consent / coach + consent /
  deny). Never throws — denied callers see nulls in the medical
  block.
- **`EmergencyContactGate` + `Interface`** — read-side gate for
  `emergency_contact_*`. Broader than medical (staff/coach path
  needs only the permission, no separate consent flag).
- **`AthleteStatusMachine` + `Interface`** — 5-state lifecycle
  validator + applier. Transition table encoded per hierarchy.md §17
  (Active→Paused/Graduated/Withdrawn/Archived, Paused→Active/…,
  Graduated→Archived only, Withdrawn→Archived only, Archived
  terminal). Enforces reason-required for Pause + Withdraw.
- **`AgeGroupSnapshotResolver` + `Interface`** — materialised age-
  group lookup from `age_groups`. Ties broken on `sort_order`.

### DTOs (role-scoped, replacing the monolithic AthleteData)

- **`AthletePublicRosterData`** — names + status only.
- **`AthleteCoachViewData`** — adds demographics + emergency
  contact (gated per-request).
- **`AthleteMedicalViewData`** — medical block gated per-request via
  the disclosure gate.

### Exceptions

- **`AthleteGuardianRequiredException`** — new. `ATHLETE_GUARDIAN_REQUIRED`
  code with `forAthlete(id, ageYears)` factory. Fires from the
  provisioner when a minor lacks guardian coverage.
- **`AthleteDobOutOfBoundsException`** — added `forFuture()` +
  `forRange()` factories with `context` payloads.

### Actions rewired

- **`CreateAthleteAction`** — no longer writes directly to the repo.
  Routes through the provisioner + passes the current user id as the
  consent-recorder.

## What's pending

### Actions to wire through the provisioner + status machine

- **`UpdateAthleteAction`** — route through
  `AthleteProvisioner::update()`. Must call `assertMedicalCallerPermitted`
  + re-check guardian coverage.
- **`WithdrawAction`** — call `AthleteStatusMachine::transition($athlete,
  AthleteStatus::Withdrawn, ['reason' => ..., 'by_user_id' => ...])`.
- **`GraduateAction`** — same, target `Graduated`. When `cascade =
  true`, also close active enrollments in one transaction (needs
  sports/athlete-enrollment's `CloseEnrollmentAction`).
- **`PauseAction`** — target `Paused` with reason.
- **`ReturnFromPauseAction`** — target `Active` (clears pause marker).
- **`ArchiveAction`** — target `Archived`. Precondition: no active
  enrollments (soft-check via the enrollment module) + no unpaid
  invoices (soft-check via finance/invoice).
- **`RestoreAction`** — undo the archive; refuse outside the
  restore window per `AthleteRestoreOutsideWindowException`.
- **`DeleteAthleteAction`** — hard delete precondition: status =
  Archived + archived > deletion grace + no active guardian rows.
- **`ConsentsConsentAction` (RecordConsentAction)** — validate
  recorder via `AthleteConsentGate`, then persist consent bundle +
  fire `AthleteConsentRecorded`.
- **`DeleteConsentAction` (RevokeConsentAction)** — same gate; fire
  `AthleteConsentRevoked`.
- **`MedicalAction`** — WRITE path. Route through
  `MedicalDisclosureGate::canWriteMedical` + persist medical bundle
  + fire `AthleteMedicalUpdated`.
- **`EmergencyContactAction`** — WRITE path. Route through
  `EmergencyContactGate::canWriteEmergencyContact` + persist +
  fire `AthleteEmergencyContactUpdated`.
- **`LinkUserAction`** — bind a User to an existing Athlete. Refuse
  when the athlete already has a `user_id` (immutable per
  `AthleteUserIdImmutableException`).
- **`ListAthleteAction`** — render `AthletePublicRosterData` from
  `Repository::query()` + scope-aware filtering.
- **`ShowAthleteAction`** — render either `AthleteCoachViewData`
  or `AthleteMedicalViewData` per the caller's permissions.

### Jobs

- **`RollAthleteAgeGroupSnapshotJob`** — season-boundary sweep.
  Batched (500 athletes/tick) over the tenant's active athletes;
  for each, calls
  `AgeGroupSnapshotResolver::resolveForDateOfBirth` + writes the
  new snapshot + fires `AthleteAgeGroupSnapshotUpdated`.
- **`CheckAthleteMinorTurnedAdultJob`** — nightly scan.
  Emits `AthleteMinorTurnedAdult` when an athlete crosses 18 so
  the FE can prompt them to record their own consents.
- **`ReconcileAthleteConsentsJob`** — sweep the consent-recorder
  chain, invalidate consent rows whose recorder is no longer an
  authorised guardian.
- **`AutoLinkAthleteToUserOnEmailMatchJob`** — when a User signs
  up with an email matching an athlete's parent guardian email,
  auto-link.
- **`PurgeArchivedAthletesJob`** — after the retention window, hard
  delete archived athletes.

### Observers / policies

- **`AthleteObserver`** — needs to enforce:
  - Medical column write requires `athletes.manage.medical`.
  - `user_id` mutation refused (per
    `AthleteUserIdImmutableException`).
  - `date_of_birth` mutation refused (per
    `AthleteDobImmutableException`).
  - `branch_id` mutation refused post-Wave 3a.
  - Emit `AthleteStatusChanged` on any status column mutation.

### Events + listeners

- `AthleteMedicalUpdated`, `AthleteEmergencyContactUpdated`,
  `AthleteConsentRecorded`, `AthleteConsentRevoked`,
  `AthletePhotoConsentChanged` — payloads scaffolded; wire
  dispatches in the respective Actions.
- Listeners on `AthleteCreated` (in the sibling modules):
  - `notifications::DispatchAthleteWelcomeNotification`
  - `cache::InvalidateBranchAthleteListCache`

### Cross-module dependencies

- **`sports/athlete-guardian`** — the provisioner's guardian check
  DEPENDS on the guardian repository. That module landed alongside
  athlete (commit `bdfa85bcf`).
- **`sports/age-group`** — the snapshot resolver queries
  `age_groups`. The module must ship its seeder before the
  provisioner runs in production.
- **`platform/branch`** — the branch existence check
  (`AthleteBranchNotActiveException`) is deferred to a soft-check
  in the provisioner. Currently unenforced.
- **`billing/entitlements`** — the `athlete_slot` consumption is
  deferred. Add an `EntitlementGate::consume('athlete_slot')` call
  inside the provisioner's `provision` transaction once the
  entitlement gate ships.

### Docs + tests

- Every Action's happy path + failure path needs a Pest v4 feature
  test. Priority: `CreateAthleteAction` (guardian-required path is
  the P0 security test).
- The provisioner's `assertGuardianCoverage` needs a mutation-testing
  pass — flip the boolean and confirm every branch is covered.

## Backlog priorities

1. **P0 — write-side Actions** (Update, Withdraw, Graduate, Pause,
   Return, Archive, RecordConsent, WriteMedical, WriteEmergencyContact).
2. **P0 — AthleteObserver** — the defense-in-depth for medical
   permission + immutable columns.
3. **P1 — Jobs** (RollAgeGroupSnapshot, CheckMinorTurnedAdult,
   ReconcileConsents).
4. **P2 — DeleteAction + PurgeArchived job**.
5. **P2 — AutoLink job**.
