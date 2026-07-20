# sports/medical — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; medical workflows pending

## Scope

Medical assessment + injury tracking + treatment workflow. Distinct
from `sports/athlete`'s `medical_*` fields (which are static
condition/allergy declarations). This module owns the ACTIVE medical
lifecycle — injuries, treatments, physio notes, return-to-play
gates.

Regulated data — every write requires
`athletes.manage.medical` OR `medical.professional` role. Reads
gate through `sports/athlete`'s `MedicalDisclosureGate`.

## What landed

- Scaffolded model + `MedicalInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`RecordInjuryAction`** — POST /medical/injuries. Payload:
  athlete, injury type, severity, date, expected return date.
  Cascades: sets the athlete's status to Paused when severity is
  Severe.
- **`RecordTreatmentAction`** — POST
  /medical/injuries/{injury}/treatments. Physio session, medication
  administered, imaging results (linked via platform/storage).
- **`ClearForReturnAction`** — POST /medical/injuries/{injury}/clear.
  Requires medical-professional role. Transitions the athlete back
  to Active. Fires `AthleteClearedForReturn`.
- **`ListMyInjuriesAction`** — GET /athletes/my/injuries. Self-view.
- **`ListActiveInjuriesAction`** — GET /medical/active. Staff-view.

### Services

- **`InjuryProvisioner`** — write-side orchestrator + athlete-status
  cascade.
- **`ReturnToPlayGate`** — enforces the clearance rule (severity
  threshold + medical-professional approval).

### Cross-module dependencies

- **`sports/athlete`** — status cascade + medical field gate.
- **`sports/session`** — bar injured athletes from active sessions.
- **`platform/storage`** — imaging + treatment record uploads.
- **`notifications/notifications`** — parent + coach notify cascade.

## Backlog priorities

1. **P0 — RecordInjuryAction + status cascade**.
2. **P0 — ClearForReturnAction + gate**.
3. **P1 — RecordTreatmentAction + storage integration**.
