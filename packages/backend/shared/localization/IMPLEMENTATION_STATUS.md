# shared/localization — Phase 3 implementation status

## Status: SCAFFOLDED — locale + translation-string models landed; import/export + Actions pending

## What landed

- **`Locale`** — supported locales (per tenant + global).
- **`TranslationString`** — key + locale + value, indexed for
  runtime lookup.
- **`TranslationNamespace`** — grouping (e.g. `auth`,
  `notifications`, `errors`).
- Enum types (`LocaleStatus`, `TranslationSource`).
- Attribute-first migrations, factories.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`ListLocaleAction`** — GET `/locales`. Tenant-scoped active
  locales.
- **`EnableLocaleAction`** — POST `/locales/{code}/enable`. Admin
  flips `is_active`. Cascades to visibility of translations.
- **`DisableLocaleAction`** — same, off.
- **`SetDefaultLocaleAction`** — POST `/locales/{code}/default`.
  Only one default per tenant.
- **`TranslateStringAction`** — POST `/translations`. Manual
  translation entry (admin surface).
- **`BulkTranslateAction`** — POST `/translations/bulk`.
  Machine-generated batch import (routes through DeepL / Google
  Translate / AWS Translate — deferred).
- **`ExportTranslationsAction`** — GET `/translations/export`.
  JSON dump for FE bundling; scoped to a namespace + locale
  filter. Consumed by the FE build step.
- **`ImportTranslationsAction`** — POST `/translations/import`.
  CSV / gettext .po upload (routes through
  `shared/transfer::StartImportAction`).
- **`ResolveKeyAction`** — GET `/translations/resolve?key=<k>&locale=<l>`.
  Single-key runtime resolver; consumed by AI-generated content
  paths that need on-demand translation.

### Services to complete

- **`TranslationResolver`** — cascade: user locale → tenant
  locale → global default. Cache-backed.
- **`MachineTranslator`** — abstraction over provider drivers
  (DeepL / Google / AWS). Deferred to a later batch.
- **`GetTextExporter` / `GetTextImporter`** — .po/.mo file
  handling.
- **`JsonTranslationExporter`** — the FE bundle target format.
- **`TranslationValidator`** — checks placeholder consistency
  (`:name`, `{name}`, `%s`) between source + translated strings.

### Seeders

- **`LocaleSeeder`** — the ~15 launch locales (en, es, fr, de,
  it, pt-BR, ja, zh-CN, ko, ar, hi, tr, ru, pl, nl).
- **`CoreTranslationSeeder`** — every `errors::*` +
  `notifications::*` key that ships with the framework, in
  every launch locale.

### Cross-module dependencies

- **`identity/user`** — `user.locale` FK.
- **`platform/tenancy`** — `tenant.default_locale` FK.
- **`notifications/notifications`** — every template resolves
  through this module.
- **`shared/transfer`** — bulk import path.
- **`compliance/consent`** — consent copy per locale.

## Backlog priorities

1. **P0 — `LocaleSeeder` + `CoreTranslationSeeder`** — no
   translated string renders without them.
2. **P0 — `ResolveKeyAction` + `TranslationResolver`** — the
   runtime hot path.
3. **P1 — `ExportTranslationsAction` (JSON)** — FE bundle
   target.
4. **P1 — locale CRUD Actions** — admin surface.
5. **P2 — machine-translation drivers** — nice-to-have.
