# sports/coaching — Phase 3 implementation status

## Status: SCAFFOLDED — module skeleton + interface landed; coach lifecycle pending

## Scope

The Coach aggregate. Coach is a Staff row acting in a coaching capacity — the
sports-specific projection of platform/staff. Owns the coach's sport
specialities, certifications, primary sport, and roster membership.

Also owns "the coach's daily surface" — the day-of-work queries
(`MyScheduleAction`, `MySessionsAction`, `MyRosterAction`,
`MyProgressReviewsAction`) that let a coach open the app and see "what am I
doing today?".

## What landed

- Scaffolded model + `CoachInterface`.
- CRUD action stubs.
- Cross-references to `sports/session` for the day-of-work queries.

## What's pending

### Actions

- **`CreateCoachAction`** — bind a Staff row as a Coach. Precondition: Staff
  exists + is Active. Set primary sport + optional secondary sports list.
- **`AssignToTeamAction`** — POST /coaches/{coach}/assign-team. Precondition:
  coach isn't already primary on a conflicting team in the same season. Emits
  `CoachAssignedToTeam`.
- **`AttachCertificationAction`** — POST /coaches/{coach}/certifications. Coach
  carries a list of certifications (First Aid, coaching level 1/2/3,
  safeguarding). Certs have expiry dates → nightly job flags expiring soon.
- **`SetPrimarySportAction`** — mutable per coach.
- **`MyScheduleAction`** — GET /coaches/my/schedule. Returns the coach's
  sessions for the next 7 days.
- **`MySessionsAction`** — GET /coaches/my/sessions.
- **`MyRosterAction`** — GET /coaches/my/roster. Every athlete on every team the
  coach is assigned to.
- **`MyProgressReviewsAction`** — GET /coaches/my/pending-reviews. Athletes
  waiting for the coach's post-session assessment.

### Services

- **`CoachAssignmentService`** — the team-assignment orchestrator.
- **`CertificationExpiryMonitor`** — nightly. Emit
  `CoachCertificationExpiringSoon` when a cert is within 30 days of expiry.
- **`AuthorisedToWriteProgress`** — gate. Coach can write progress ONLY for
  athletes on teams they're assigned to.

### Events

- `CoachAssignedToTeam`, `CoachUnassignedFromTeam`,
  `CoachCertificationAttached`, `CoachCertificationExpired`,
  `CoachPrimarySportChanged`.

### Cross-module dependencies

- **`platform/staff`** — the underlying Staff row.
- **`sports/team`** — team membership.
- **`sports/session`** — schedule query.
- **`sports/progress`** — progress-authorship gate.

## Backlog priorities

1. **P0 — CreateCoachAction + AssignToTeamAction**.
2. **P0 — AuthorisedToWriteProgress gate** (feeds progress module).
3. **P1 — MyScheduleAction / MySessionsAction / MyRosterAction**.
4. **P1 — CertificationExpiryMonitor + notification cascade**.
