# sports/formations — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; team-formation editor pending

## Scope

Team formation / lineup templates. Football-specific (4-3-3, 4-4-2, 3-5-2 etc.)
— the drop-and-drag arrangement of players on a virtual pitch. Consumed by
`sports/match` on lineup selection.

Sport-agnostic at the schema level (basketball has 1-2-2 zone defense,
volleyball has 5-1 vs 6-2), but the module ships football as the primary
reference.

## What landed

- Scaffolded model + `FormationInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`CreateFormationAction`** — POST /teams/{team}/formations. Payload:
  positions grid + player assignments.
- **`SetActiveFormationAction`** — pin the team's default formation for
  match-day lineup autoselect.
- **`ListFormationsAction`** — GET /teams/{team}/formations.

### Services

- **`FormationTemplateRegistry`** — the shipped catalog of standard formations
  per sport (football 4-3-3, 4-4-2, ...).
- **`FormationRenderer`** — SVG output for the FE's pitch view.

### Cross-module dependencies

- **`sports/team`** — parent team.
- **`sports/match`** — lineup consumer.
- **`sports/registry`** — sport-specific position catalog.

## Backlog priorities

1. **P2 — CreateFormationAction**.
2. **P2 — FormationTemplateRegistry seeder (football + basketball)**.
