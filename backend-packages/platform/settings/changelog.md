# settings — changelog

## [Unreleased] — inception

- Attribute-driven settings platform authored. Wraps `spatie/laravel-settings`.
- Ships `#[AsSetting]` + `#[SettingGroup]` + `#[SettingField]` attributes.
- Build-time discovery via foundation's `DiscoversAttributes` seam.
- Scope hierarchy: `system → tenant → user` (org / branch deferred to scope
  module).
- Dual-write audit: `activity` (tenant feed) + `audit` (compliance trail) on
  every SettingsChangeEvent.
- HTTP surface: `/api/v1/settings/{group}` + schema endpoint.
- Sensitive-field masking + optional KMS encryption via
  `EncryptedSensitiveSettingCast`.
- `ControlType` enum + widget mapping (Toggle, Select, TextField, NumberField,
  Time, Timezone, ColorPicker, ...).

### Compatibility

- Depends on `foundation`, `tenants`, `activity`, `audit`.
- No breaking change surface — inception release.
