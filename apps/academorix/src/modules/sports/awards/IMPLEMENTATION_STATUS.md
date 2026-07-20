# sports/awards — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; award lifecycle pending

## Scope

Achievement + award tracking. Medals, certificates, MVP, Player of the Month,
etc. Awards are tenant-configured (each tenant defines their own award catalog)
and can be team-level or individual.

## What landed

- Scaffolded model + `AwardInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`CreateAwardAction`** — POST /awards. Admin-defines an award template.
- **`GrantAction`** — POST /awards/{award}/grant. Payload: recipient (Athlete or
  Team), season, evidence. Fires `AwardGranted`.
- **`ListMyAwardsAction`** — GET /athletes/my/awards.
- **`RevokeAction`** — POST /awards/grants/{grant}/revoke.

### Services

- **`AwardGranter`** — write-side orchestrator + notification cascade.

### Cross-module dependencies

- **`sports/athlete`** / **`sports/team`** — recipient.
- **`notifications/notifications`** — parent-notify cascade.

## Backlog priorities

1. **P1 — CreateAwardAction + GrantAction**.
2. **P2 — ListMyAwardsAction**.
