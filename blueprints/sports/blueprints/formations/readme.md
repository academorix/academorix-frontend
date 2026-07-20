# formations

Formation templates + tactical board coordinates per blueprint §11.2. Wave 3
sports.

## Owned entities

- `Formation` (`frm_`) — named template scoped by sport_key.
- `FormationSlot` (`fsl_`) — individual slot with x/y coordinates (0-100).

## Consumed by

- `sports/event` — lineup builder maps athletes into slots.
- `sports/session` — training drills reference formation shapes.
- `public-site` — public lineup renders.

## Validation

`ValidateSlotCountVsTeamSize` hook ensures `Formation.expected_slot_count`
matches the sport-config `team_size` from registry. Formations for sports
without `FORMATIONS` capability refused at create.

## ULID prefixes

- `frm_`, `fsl_`
