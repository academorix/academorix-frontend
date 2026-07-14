# settings

Attribute-driven settings platform. Wave 2 infrastructure. Wraps `spatie/laravel-settings` with attribute-based discovery + scope hierarchy + dual-write audit.

## 1. The taxonomy — group / section / field

Every setting lives at three nesting levels:

```
group   (top-level, one per settings class — 'notification', 'preferences', 'theme')
  └─ section  (#[SettingGroup] label — visual grouping like 'Channels', 'Digest')
      └─ field   (#[SettingField] on a property — 'email_enabled', 'digest_frequency')
```

Group = API namespace segment (`/api/v1/settings/notification`). Section = visual heading in the admin UI. Field = the individual value.

## 2. Declaring a settings class

Any module contributes settings by declaring a class extending `Spatie\LaravelSettings\Settings` decorated with `#[AsSetting]`:

```php
use Academorix\Settings\Attributes\{AsSetting, SettingGroup, SettingField};
use Academorix\Settings\Enums\ControlType;
use Spatie\LaravelSettings\Settings;

#[AsSetting(
    group: 'notification',
    label: 'Notifications',
    description: 'Notification channel and delivery preferences.',
    icon: 'bell',
    scope: 'tenant',
    sortOrder: 3,
)]
class NotificationSettings extends Settings
{
    #[SettingGroup(label: 'Channels', description: 'Toggle individual channels.', icon: 'radio', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Email Enabled', group: 'Channels', sortOrder: 1)]
    public bool $email_enabled = true;

    #[SettingField(controlType: ControlType::Toggle, label: 'SMS Enabled', group: 'Channels', sortOrder: 2)]
    public bool $sms_enabled = false;

    public static function group(): string
    {
        return 'notification';
    }
}
```

Build-time discovery via foundation's `DiscoversAttributes` seam hydrates the `SettingsRegistry` at boot. Zero manual registration.

## 3. Scope hierarchy

Reads cascade: `user override → tenant override → system default → property default`.

Writes target a specific scope: `system` writes require super-admin; `tenant` writes require tenant admin; `user` writes require the owner.

Scope is declared per class via `AsSetting(scope: 'system' | 'tenant' | 'user')`. A `tenant`-scoped class allows tenant overrides but NOT user overrides — that's an intentional guardrail against per-user drift on tenant-wide policy.

Org / branch scopes are deferred until the `scope` module lands. When it ships, the resolver picks up the extra levels automatically without changes to consuming code.

## 4. Dual-write audit

On every `PUT /api/v1/settings/{group}`, one `SettingsChangeEvent` fires per changed field. Two listeners consume:

- `activity::WriteSettingsChangeToActivity` — writes to `activity_log` via `HasActivityLog`. Tenant-facing product feed, tier retention.
- `audit::WriteSettingsChangeToAudit` — writes to `audits` via `HasAudit`. Compliance trail, 7y cold. KMS-encrypted for sensitive fields.

Both listeners are registered by this module's service provider. Neither is optional in production — dual-write is the audit contract.

## 5. HTTP surface

| Method + path | Purpose |
| --- | --- |
| `GET /api/v1/settings` | List every registered group + resolved values (paginated). |
| `GET /api/v1/settings/schema` | Full schema (groups + sections + fields + control types + validation) for admin UI rendering. |
| `GET /api/v1/settings/{group}` | Read one group's resolved values (cascade applied). |
| `PUT /api/v1/settings/{group}` | Partial update. Fires SettingsChangeEvent per changed field. |
| `GET /api/v1/settings/{group}/schema` | Schema for one group only \u2014 lighter payload for isolated forms. |

Public-flagged groups (`AsSetting(public: true)`) skip auth on GET; PUT still requires permission.

## 6. Sensitive fields

`SettingField(sensitive: true)` masks the value in read responses (returns `"***"`). Reads with `?reveal=true` require the owning permission + write an audit row. Optional additional AES-KMS encryption via `EncryptedSensitiveSettingCast`.

## 7. Files

Standard blueprint plus:
- `attributes.json` — declarative shape of `#[AsSetting]` + `#[SettingGroup]` + `#[SettingField]`.
- `registry.json` — the SettingsRegistry contract.
- `control-types.json` — the ControlType enum + widget mapping.

## 8. What this module does NOT do

- **Doesn't own domain-specific settings classes.** Each module contributes its own (`NotificationSettings` in `notifications`, `MailSettings` in `notifications-mail`, etc.). This module owns the platform + attribute surface + resolver + storage + HTTP.
- **Doesn't own theme-specific concerns.** Design tokens + theme presets live in a future `theme` module.
- **Doesn't broadcast on WebSockets.** Settings changes are cache-invalidated on the next request; real-time UI updates require the tenant to add their own SSE / websocket bridge on top of `SettingsChangeEvent`.
