# sports/private-sessions — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; booking flow pending

## Scope

1:1 or small-group coaching sessions — the paid-add-on to regular
enrollment. Distinct from `sports/session` (which is
enrollment-included group training). Private sessions have their
own booking + payment flow and don't count toward attendance
metrics for a season.

## What landed

- Scaffolded model + `PrivateSessionInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`BookAction`** — POST /private-sessions. Payload: athlete,
  coach, facility, time window, duration, rate. Preconditions:
  coach available, facility available. Creates a finance/order via
  the finance module. Fires `PrivateSessionBooked`.
- **`CompleteAction`** — POST /private-sessions/{session}/complete.
  Trigger the coach's payment cycle + release the athlete for
  re-booking.
- **`AddNotesAction`** — POST /private-sessions/{session}/notes.
  Coach's post-session write-up. Optionally attaches evidence.
- **`CancelAction`** — POST /private-sessions/{session}/cancel.
  Refund per policy — 48h+ notice full refund, less than 48h no
  refund (configurable per tenant).

### Services

- **`PrivateSessionBooker`** — write-side orchestrator.
- **`CoachRateResolver`** — reads the coach's per-hour rate for the
  athlete's sport.

### Cross-module dependencies

- **`sports/coaching`** — coach availability + rate.
- **`platform/facility`** — facility booking.
- **`finance/order`** — payment flow.

## Backlog priorities

1. **P0 — BookAction + full booking chain**.
2. **P0 — CompleteAction + coach payment trigger**.
3. **P1 — CancelAction + refund policy engine**.
