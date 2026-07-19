# academorix/search

Server-side Laravel package for the `search` module. Auto-generated from the
blueprint at `modules/shared/blueprints/search/`.

## Entities

- **SearchAnalyticsEvent** (`sae_...`) — One search-related interaction — a
  query fired, a no-results occurrence, an autocomplete suggest, or a
  click-through.
- **SearchIndex** (`sidx_...`) — Registry row for one
  `(model_class, engine, index_name)` triple.
- **SearchSavedQuery** (`sq_...`) — User-saved query.
- **SearchSyncJob** (`ssync_...`) — Persisted operation record for reindex +
  backfill + flush + alias-swap runs.
- **SearchSynonym** (`syn_...`) — One synonym entry.

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
    shared search --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-shared/search-sdk` under `sdk/shared-search-sdk/`. Consumers cross
the service boundary through the SDK; this package is the SERVER-side owner of
the domain.
