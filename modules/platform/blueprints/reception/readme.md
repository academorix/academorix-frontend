# reception

Front-desk operational surface per blueprint §10.20. Wave 2.

## What this module owns

- `ReceptionVisit` (`rvs_`) — walk-in visitor tracker.

## What this module ORCHESTRATES (doesn't own)

- **Approval queue** — from `workflow/approvals`.
- **Day passes** — from `platform/facility`.
- **Wristbands** — from `platform/credentials`.
- **Walk-in registration** — cascades through `athlete` + `finance/membership` +
  `finance/payment`.

## Reception routes

- Walk-in registration → creates Athlete + Membership + Invoice + Payment in one
  action.
- Issue wristband → creates Credential linked to the athlete.
- Day pass → creates DayPass via facility + Payment.
- Check-in monitor → live view of `credentials` CheckinLog feed.
- Approval queue → composes `workflow/approvals` UI.

## ULID prefixes

- `rvs_`
