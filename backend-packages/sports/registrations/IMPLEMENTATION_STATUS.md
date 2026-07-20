# sports/registrations — Phase 3 implementation status

## Status: SCAFFOLDED — module skeleton + interface landed; wizard flow pending

## Scope

Public-facing registration flow — the multi-step wizard a new parent
runs to enroll their child. Distinct from `sports/athlete-enrollment`
(which is the admin-side enrollment write). Registrations may end in
Applied / Approved / Rejected — Approved feeds the enrollment
module.

## What landed

- Scaffolded model + `RegistrationInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`StartAction`** — POST /registrations/start. Anonymous
  entry-point. Returns a wizard session token + step-1 form config
  (via `sports/attribute-registry`).
- **`AddAthleteAction`** — POST /registrations/{registration}/athlete.
  Step 2 — the athlete's basic info + DOB. Materialises the
  age-group snapshot for the wizard's downstream steps.
- **`ChooseTeamAction`** — POST /registrations/{registration}/team.
  Step 3 — the parent picks a team from the age-group + gender
  filtered list.
- **`AttachDocumentsAction`** — POST
  /registrations/{registration}/documents. Step 4 — waiver +
  medical clearance + guardian ID uploads. Files stored via
  platform/storage.
- **`PayAction`** — POST /registrations/{registration}/pay. Step 5
  — creates a finance/order + returns the payment page URL. On
  successful webhook, transitions the registration to Paid.
- **`CompleteAction`** — POST /registrations/{registration}/complete.
  Final admin-side approval. Creates the athlete + guardian +
  athlete-enrollment rows atomically via the respective
  provisioners. Fires `RegistrationApproved`.
- **`RejectAction`** — POST /registrations/{registration}/reject.
  Reason required + refund cascade.

### Services

- **`RegistrationWizard`** — multi-step orchestrator.
  Persists per-step state to `registrations.wizard_state` JSONB.
- **`RegistrationApprover`** — the atomic create-everything on
  approval.

### Cross-module dependencies

- **`sports/athlete`** — final athlete row.
- **`sports/athlete-guardian`** — guardian row on approve.
- **`sports/athlete-enrollment`** — enrollment on approve.
- **`sports/team`** — team-list filter.
- **`sports/age-group`** — age-group filter.
- **`finance/order`** — payment.
- **`platform/storage`** — document uploads.

## Backlog priorities

1. **P0 — Full wizard flow (Start / AddAthlete / ChooseTeam /
   AttachDocuments / Pay / Complete)**.
2. **P0 — RegistrationApprover atomic-create-on-approve**.
3. **P1 — RejectAction + refund cascade**.
