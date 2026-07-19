# academorix/match

Server-side Laravel package for the `match` module. Auto-generated from
the blueprint at `modules/sports/blueprints/match/`.

## Entities

- **MatchEvent** (`mev_...`) — One row per in-match timeline entry (goal, assist, own_goal, yellow/red card, substitution, apparatus_score, lane_time,...
- **MatchFixture** (`mat_...`) — Canonical competitive-match row.
- **MatchNote** (`mno_...`) — Coach-authored recap note for a match, with visibility tier (coach_only / parents / public).
- **MatchParticipant** (`mpa_...`) — Polymorphic participant row for multi-team events (galas, swim meets, festivals) where a single match aggregates N teams...
- **MatchResult** (`mre_...`) — Per-participant final result for a match.
- **MatchSquadEntry** (`msq_...`) — One row per athlete selected (or considered) for a match's squad.
- **OpponentLogo** (`olg_...`) — Cache of external-opponent logos keyed by normalized name for reuse across matches.

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
    sports match --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every
other file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at `academorix-sports/match-sdk`
under `sdk/sports-match-sdk/`. Consumers cross the service boundary
through the SDK; this package is the SERVER-side owner of the domain.
