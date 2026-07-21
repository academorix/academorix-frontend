# safeguarding

Staff vetting + policy compliance per blueprint §14.6. **Youth-sports
mandatory** module. Wave 3.

## What this module owns

- `BackgroundCheck` (`bgc_`) — DBS / SafeSport / state-BCI / custom clearance
  records with verified/expired lifecycle.
- `PolicyAcknowledgement` (`pak_`) — immutable staff acknowledgements of policy
  versions.

## What compliance module owns (not us)

- `SafeguardingIncident` — the report intake surface for minor-welfare concerns
  (owned by `compliance/compliance`).

We handle the STAFF side; compliance handles the REPORT side.

## Assignment gate

`AssignmentGate::canAssign(staff, team)` returns false when:

- The staff member has NO verified BackgroundCheck of type required by tenant
  policy.
- The latest verified BackgroundCheck has `expires_at` in the past.
- The staff member has not acknowledged the latest safeguarding policy version.

Consumed by:

- `coaching` when assigning to a team.
- `event` when a coach is registered on an event.

## ULID prefixes

- `bgc_` — BackgroundCheck
- `pak_` — PolicyAcknowledgement
