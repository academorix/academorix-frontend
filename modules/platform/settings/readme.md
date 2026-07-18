# academorix/settings

Attribute-driven settings platform for Academorix. Ships the declarative
authoring surface every module writes against (`#[AsSetting]` / `#[SettingGroup]`
/ `#[SettingField]`), a boot-time discovery pass that hydrates a shared
registry, and a resolver that reads via the `system → tenant → user` cascade.
Wraps [`spatie/laravel-settings`](https://github.com/spatie/laravel-settings)
for the storage layer.

## Aggregates

| Aggregate         | ULID prefix | Table              | Purpose                                                                                     |
| ----------------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `SettingsGroup`   | `sgr_`      | `settings_groups`  | Top-level group like `general` / `billing` / `notifications`. System-owned rows are locked. |
| `SettingsSchema`  | `sss_`      | `settings_schemas` | One row per registered `#[SettingField]` — the field catalogue.                             |
| `SettingValue`    | `stv_`      | `setting_values`   | Per-scope value. `scope_kind ∈ {system, tenant, user}`; system rows carry `scope_id = NULL`. |

## Install

```bash
composer require academorix/settings
```

## Blueprint

Wire contract at `modules/platform/blueprints/settings/`.

## Contributes

- **Attributes**: `AsSetting` (marks a class as a settings container),
  `SettingGroup` (visual section on that class), `SettingField` (per-property
  declaration).
- **Contracts (framework-swappable)**: `SettingsServiceInterface`,
  `SettingsRegistryInterface`, `SettingsResolverInterface`,
  `SettingsWriterInterface`. Default implementations ship in `src/Services`.
- **Bootstrappers**: `SettingsDiscoveryBootstrapper` — scans every
  `#[AsSetting]` class at boot and hydrates the registry.
- **Events**: `SettingsChangeEvent`, `SettingsGroupResolved`,
  `SettingsWriteRefused`. All `ShouldDispatchAfterCommit`.
- **Permissions**: `SettingsPermission` (view + manage — dual-guard) mapped onto
  spatie's guard-aware permission rows.
- **Commands**: `settings:describe`, `settings:seed`, `settings:show`,
  `settings:export`, `settings:import`.
- **Jobs**: `ExportSettingsJob`, `ImportSettingsJob`, `MigrateSettingsSchemaJob`.
- **Cast**: `EncryptedSensitiveSettingCast` — encrypts values whose owning
  schema carries `sensitive: true`.

## Hierarchy resolution

Reads resolve deepest-first:

1. `user`  — the caller's user-scope override.
2. `tenant` — the caller's tenant-scope override.
3. `system` — the platform default seeded by the discovery pass.
4. The field's declared `default_value` when no row is found.

`org` and `branch` levels are deferred until the scope module lands.

## Dual-write

Every write dispatches a `SettingsChangeEvent` (after commit) which is consumed
by both the `activity` module (tenant-facing feed) and the `audit` module
(immutable compliance trail).

## Tests

```bash
composer install
vendor/bin/pest
```
