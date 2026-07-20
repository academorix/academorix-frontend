# Settings

Attribute-driven settings platform for the Academorix backend. Ships:

- `#[AsSetting]` + `#[SettingField]` + `#[SettingGroup]` — the declarative
  surface every domain writes against.
- A build-time discovery pass that populates a `SettingsRegistry` (Octane-safe,
  scoped per request).
- The `SettingsService` — reads with hierarchy resolution
  (`system → tenant → user`), writes with partial merge, dispatches
  `SettingsChangeEvent` for real-time propagation.
- Dual-write audit — one listener writes each changed field to `activity_log`
  (tenant-facing product feed, tier-based retention) and another to `audits`
  (compliance trail, 7-year retention). No bespoke third audit table.
- A read-only HTTP surface: `List / Show / Update` per group plus a `Schema`
  sub-endpoint.
- 13 non-theme system setting classes covering the common ops concerns (App
  version, Auth, Mail, Notifications, Preferences, Search, Security, Storage,
  Subscription, Localization, Import / Export, Reporting, General).

Theme-specific concerns — the `ThemePreset` model, the `ThemeSettings` group,
the `Has*Colors` design-token traits, and the theme-specific enums — live in the
sibling [`academorix/theme`](../theme) package. Every app that only needs to
declare settings against the platform requires this package; apps that render an
admin theme editor add `academorix/theme` on top.

## Public HTTP surface

| Method + path                  | Purpose                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `GET /api/v1/settings`         | List every registered group + its resolved values.                 |
| `GET /api/v1/settings/{group}` | Read one group's resolved values (system → tenant → user cascade). |
| `PUT /api/v1/settings/{group}` | Partial update of one group. Fires `SettingsChangeEvent`.          |
| `GET /api/v1/settings/schema`  | Full schema for admin UI rendering.                                |

The audit trail is queryable via the shipped observability packages — the
tenant-facing feed at `GET /api/v1/activities?filter[log_name]=settings` and the
compliance trail at
`GET /api/v1/audits?filter[auditable_type]=Academorix\Settings\Group.<group>`.

Routes ship the `[api, tenant, auth:sanctum]` middleware stack and are declared
on the actions via `#[AsAction]` + `#[Get]` / `#[Put]` — no `routes/*.php` file.
Actions are one class per endpoint per ADR 0016.

## Declaring a setting group

```php
use Academorix\Settings\Attributes\{AsSetting, SettingField, SettingGroup};
use Academorix\Settings\Enums\ControlType;
use Spatie\LaravelSettings\Settings;

#[AsSetting(
    group: 'notifications',
    label: 'Notifications',
    description: 'Email and push notification preferences.',
    icon: 'bell',
    permission: 'settings.notifications.read',
    scope: 'tenant',
)]
class NotificationSettings extends Settings
{
    #[SettingGroup(label: 'Channels', icon: 'bell', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Email Notifications', group: 'Channels')]
    public bool $email_enabled = true;

    #[SettingField(controlType: ControlType::Toggle, label: 'Push Notifications', group: 'Channels')]
    public bool $push_enabled = true;

    public static function group(): string
    {
        return 'notifications';
    }
}
```

The build-time discovery pass (via
`Academorix\Foundation\Contracts\DiscoversAttributes`) picks up the class +
hydrates the `SettingsRegistry` at boot; no manual registration.

## Storage + hierarchy

Every value lives in `scope_values` under the `settings` namespace. The
`academorix/scope` substrate owns the hierarchy cascade
(`global → application → tenant → org → region → branch → team → user`), so this
package holds no config knobs for tenant / user scoping — the scope middleware
sets the active node per-request, and reads / writes flow through
`Scope::resolve('settings', ...)` and `ScopeResolution::write('settings', ...)`.

The provider registers `settings` as a scope consumer at boot; the substrate
handles namespace validation + tenant isolation + retention.

## Audit trail

Two shipped listeners subscribe to `SettingsChangeEvent` on every write:

- `WriteSettingsChangeToActivity` → writes each changed field to `activity_log`
  via `academorix/activity`. Tenant-facing widget feed, tier-based retention (30
  / 90 / 365 days).
- `WriteSettingsChangeToAudit` → writes each changed field to `audits` via
  `owen-it/laravel-auditing`'s model directly. Compliance trail, 7-year
  retention.

Neither is configurable — dual-write is the package's audit contract. Slim
deployments that want to opt out of one sink remove the subscription in their
own `EventServiceProvider`.

## Depends on

- `academorix/foundation` — base primitives.
- `academorix/activity` — audit-trail sink (product-feed side).
- `academorix/audit` — audit-trail sink (compliance side).
- `academorix/crud` — `Repository` base + `#[AsRepository]` + `#[UseModel]` +
  `#[Cacheable]`.
- `academorix/enum` — `Enum` trait for backed enums.
- `academorix/events` — `#[AsEvent]` marker.
- `academorix/routing` — controller routing attributes.
- `academorix/scope` — the future substrate for value storage.
- `academorix/service-provider` — `ServiceProvider` base.
- `academorix/tenancy` — `BelongsToTenant` trait.
- `owen-it/laravel-auditing` — for the compliance-trail listener.
- `spatie/laravel-activitylog` — for the product-feed listener.
- `spatie/laravel-settings` — the Spatie Settings storage layer.
- `spatie/laravel-data` — request + output DTOs.

## Sibling packages

- [`academorix/theme`](../theme) — every theme-specific concern.
