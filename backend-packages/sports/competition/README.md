# academorix/competition

Server-side Laravel package for the `competition` module. Auto-generated from
the blueprint at `modules/sports/blueprints/competition/`.

## Entities

- **BracketNode** (`bkt_...`) — Knockout tournament bracket node — round +
  position + participant refs + winner_advances_to_node_id.
- **CompetitionFixture** (`cmf_...`) —
- **CompetitionTeam** (`cmt_...`) —
- **Competition** (`cmp_...`) —
- **StandingRow** (`std_...`) — Denormalised league table row — recomputed on
  every fixture result via RecomputeStandingsJob.

## Layout

```
src/
├── Providers/                     # <Name>ServiceProvider (module boot)
├── Contracts/
│   ├── Data/*Interface.php        # TABLE + ATTR_* constants (#[Bind]-bound to Model)
│   └── Repositories/*Interface.php
├── Models/*.php                   # Eloquent, attribute-first
├── Repositories/*.php             # #[AsRepository] + #[UseModel]
├── Data/*.php                     # Spatie Data output DTOs
├── Policies/*.php                 # Wired via #[UsePolicy] on the Model
├── Events/*.php                   # Domain events (ShouldDispatchAfterCommit)
└── Actions/*.php                  # Single-invoke controllers (#[AsController])
database/
├── migrations/*.php
├── factories/*.php
└── seeders/*.php                  # (dual-source catalogues only)
tests/
├── Feature/
└── Unit/
```

## Regeneration

```bash
python3 modules/shared/blueprints/foundation/scripts/generate-module.py \
    sports competition --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/competition-sdk` under `sdk/sports-competition-sdk/`.
Consumers cross the service boundary through the SDK; this package is the
SERVER-side owner of the domain.
