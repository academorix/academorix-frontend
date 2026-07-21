---
inclusion: fileMatch
fileMatchPattern: "**/Settings/**/*.php"
---

# Settings — rules of engagement

> **Status note.** This rule assumes `packages/framework/settings/` has landed
> per ADR-0019. Until then the `fileMatch` pattern still fires on domain
> `Settings/` folders as a preview — the compiler internals it describes
> (`Scope::write('settings', ...)`, `SettingValidationException`, the
> `#[AsSetting]` + `#[SettingField]` attribute pair) become active with the
> package.

Every user-editable configuration surface in the platform goes through
`stackra/settings`. Custom key-value tables, bespoke "config" rows in a
domain model, or `env()` reads inside a service are all off-pattern.

## The hard rules

### 1. One `#[AsSetting]` class per surface

A settings group is a class carrying `#[AsSetting]` under some `Settings/`
namespace of a domain module
(`apps/api/src/modules/ tenancy/src/Settings/TenancySettings.php`). The class
has no methods beyond an optional param-less constructor — its purpose is to
declare property defaults. Every editable field is a public property with
`#[SettingField]`.

### 2. Property-default is the truth

A field's default value lives on the PHP property
(`public string $app_name = 'Stackra'`). `#[SettingField(defaultValue: …)]`
is only used when the default doesn't fit as a property default (closures,
callable factories, computed shapes). The compiler picks up the property default
automatically — no duplication.

### 3. Validation lives on the attribute

Every field declares `validation: [...]` with Laravel rule strings. The service
runs them before writing to `scope_values`; a failure throws
`SettingValidationException` which the HTTP layer maps to a 422. NEVER validate
in the controller — the service is the single gate.

### 4. Sensitive fields set `sensitive: true`

Passwords, API keys, tokens, webhook secrets. The service masks them to `null`
in read responses even for callers who have the right permission. Reading the
raw value requires a server-side call through
`$service->getRawValue($group, $field)` (follow-up API — not shipped in v1).

### 5. Storage goes through scope

Settings write to `scope_values` under `namespace = 'settings'` via
`Scope::write('settings', $node, "{group}.{field}", $value)`. NEVER touch
`scope_values` directly. NEVER create a bespoke `settings_values` table.

### 6. HeroUI-agnostic schema output

`controlType` is a semantic name (`text`, `number`, `file`, `color`, …).
`constraints` is validation-shaped. `ui` is visual-hint-shaped. The frontend
`SchemaFormRenderer` owns the HeroUI mapping — the backend never emits HeroUI
class names or prop shapes.

### 7. Group keys match the scope-consumer regex

`^[a-z][a-z0-9_]{0,63}$`. Lowercase, alphanumeric + underscores, starts with a
letter. The scope consumer registry enforces this; `#[AsSetting]` shipping an
off-pattern key throws at boot.

### 8. Audit is fire-and-forget

Every write posts one row to `settings_audit_log`. If the audit insert fails
(disk full, table locked, whatever), the write to `scope_values` still commits
and the request returns 200. Corrupting the operator's write path over a logging
failure is worse than a partial audit trail.

## Anti-patterns

- ❌ Custom `settings_general` / `settings_theme` tables. Every value lives in
  `scope_values`; storage is not the settings package's concern.
- ❌ `env('APP_NAME')` inside a runtime service. Env is build-time — every
  runtime string a tenant might override goes through
  `Scope::resolve('settings', 'general.app_name')`.
- ❌ Non-public property carrying `#[SettingField]`. Compiler skips non-public
  properties silently — the field never appears in the schema.
- ❌ Validation duplicated between `#[SettingField(validation: …)]` and a
  controller `FormRequest` `rules()` method. The service runs the attribute
  rules; the FormRequest is shape-only (per-key validation lives on the field).
- ❌ Bespoke schema endpoints per settings group. Every group hangs off the
  shared `/schema` endpoint. Rendering differences (theme editor vs mail
  settings) are the frontend's job.

## Related steering

- `scope.md` — the storage substrate; every setting is a `scope_values` row.
- `conventions.md` — strict types + docblocks apply.
- `package-architecture.md` — the framework/domain layering that puts
  `#[AsSetting]` classes in domain modules and this framework package in
  `packages/framework/`.
