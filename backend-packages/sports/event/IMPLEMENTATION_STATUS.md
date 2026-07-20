# sports/event — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; event lifecycle pending

## Scope

Non-training events — showcases, camps, tryouts, tournaments (the
academy's own hosted tournament, not `sports/competition` which is
externally-scoped). Distinct from `sports/session` (which is a
recurring training touchpoint).

## What landed

- Scaffolded model + `EventInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`CreateEventAction`** — payload includes ticketed / free flag.
  When ticketed, links to finance/order for ticket sales.
- **`RegisterAction`** — POST /events/{event}/register. Public path
  for non-tenant attendees to register + pay.
- **`CheckInAction`** — POST /events/{event}/check-in. QR-scan flow
  at the door.
- **`CancelAction`** — cancels + refunds ticket sales.

### Services

- **`EventProvisioner`** — orchestrator.
- **`TicketIssuer`** — reads the finance/order state + emits QR
  codes.

### Cross-module dependencies

- **`finance/order`** — ticket sales.
- **`platform/facility`** — venue booking.
- **`platform/storage`** — event assets (images, PDFs).

## Backlog priorities

1. **P1 — CreateEventAction**.
2. **P1 — RegisterAction (public ticket flow)**.
3. **P2 — CheckInAction (QR flow)**.
