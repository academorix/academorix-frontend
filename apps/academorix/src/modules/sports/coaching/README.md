# stackra/coaching

Server-side Laravel package for the `coaching` module. Auto-generated from the
blueprint at `modules/sports/blueprints/coaching/`.

## Entities

- **CoachAssignment** (`cas_...`) — Polymorphic pivot binding a CoachingProfile
  to a Session / Team / Event with a role (head_coach / assistant_coach /
  obse...
- **CoachCertification** (`ccf_...`) — Held certification credential for a
  CoachingProfile.
- **CoachSkillRating** (`csr_...`) — Per-Coach per-Sport/Discipline/Position
  rating.
- **CoachingProfile** (`cop_...`) — Per-Staff coaching satellite.

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
    sports coaching --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-sports/coaching-sdk` under `sdk/sports-coaching-sdk/`. Consumers
cross the service boundary through the SDK; this package is the SERVER-side
owner of the domain.
