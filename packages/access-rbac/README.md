# academorix-access/rbac

Server-side Laravel package for the `rbac` module. Auto-generated from the
blueprint at `modules/access/blueprints/rbac/`.

## Entities

- **ModelHasPermissions** (`...`) — Spatie's shipped `model_has_permissions`
  polymorphic pivot augmented with denormalised (application_id, tenant_id).
- **ModelHasRoles** (`...`) — Spatie's shipped `model_has_roles` polymorphic
  pivot augmented with denormalised (application_id, tenant_id) + `assigned...
- **Permission** (`per_...`) — Spatie's `permissions` table augmented with
  Academorix scope columns (application_id, tenant_id, is_system,
  description,...
- **RoleDefinition** (`rdf_...`) — Academorix metadata layer FK-linked to system
  roles.
- **RoleHasPermissions** (`...`) — Spatie's shipped `role_has_permissions` pivot
  table augmented with denormalised `application_id` + `tenant_id` for query...
- **Role** (`rol_...`) — Spatie's `roles` table augmented with Academorix scope
  columns (application_id, tenant_id, is_system, description, sort_...

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
    access rbac --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-access/rbac-sdk` under `sdk/access-rbac-sdk/`. Consumers cross the
service boundary through the SDK; this package is the SERVER-side owner of the
domain.
