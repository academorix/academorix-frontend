# localization — changelog

## [Unreleased] — wave 5 refactor: PlatformLanguage dedupe against geography

**Breaking, blueprint-scoped.**

- `Language` renamed → `PlatformLanguage`. Class, interface, observer
  (`PlatformLanguageObserver`), policy (`PlatformLanguagePolicy`), controller
  (`PlatformLanguageController` on both tenant + platform-admin surfaces).
- Table `languages` renamed → `platform_languages`. Fixes the collision with the
  vendor-owned `languages` table shipped by `nnjeim/world` in the geography
  module.
- Duplicated ISO-639 + ISO-3166 fields dropped from PlatformLanguage: `code`,
  `iso_639_1`, `iso_639_3`, `name`, `native_name`, `direction`, `country_code`,
  `flag_emoji`. All still readable to callers via accessors chaining through the
  joined geography rows.
- Two new outbound FKs on PlatformLanguage:
  - `geography_language_id` → `geography::languages` (NOT NULL, onDelete
    restrict). Source of truth for ISO-639 metadata.
  - `geography_country_id` → `geography::countries` (NULL, onDelete restrict).
    Populated only for regional variants like `fr-CA`.
- Composite unique index on
  `(geography_language_id, geography_country_id, script_code)` guards against
  duplicate PlatformLanguage rows for the same effective locale.
- Module priority bumped `14 → 66`. `geography` (priority 65) added as a hard
  dependency.
- CLI command renamed: `localization:seed-languages` →
  `localization:seed-platform-languages` (class `SeedLanguagesCommand` →
  `SeedPlatformLanguagesCommand`). Now performs the geography lookup at seed
  time; requires `php artisan world:install` to have run.
- Schema file `schemas/language.schema.json` retired; replaced by
  `schemas/platform-language.schema.json`.

**Intentionally preserved** (concept-name is user-facing, class-name is a
code-only detail):

- Public URLs: `/api/v1/languages`, `/api/v1/platform/languages`.
- Permission strings: `languages.viewAny`, `languages.view`,
  `platform.languages.*`.
- Event names: `LanguageEnabledForTenant`, `LanguageDisabledForTenant`.
- Error codes: `LANGUAGE_NOT_FOUND`, etc.
- Cache keys: `loc:languages:catalogue`.
- FK column names on downstream tables: `TenantLocale.language_id`,
  `Translation.language_id` (Laravel's FK convention decouples column name from
  target table name).
- Route model binding param `{language}` in URLs.

### Compatibility

- Adds `geography` as a hard dependency.
- Database migration required: rename table `languages` → `platform_languages`,
  drop retired columns, add `geography_language_id` + `geography_country_id`
  columns + FKs, recompute indexes.

## [Unreleased] — inception

- Localization platform authored. Four entities: `Language`, `TenantLocale`,
  `Translation`, `TranslationJob`.
- Decorator over Laravel's `Translator` — DB cache lookup precedes file lookup.
- Locale resolution middleware with 7-step precedence chain.
- Machine translation drivers: OpenAI, Google Cloud Translation, DeepL, AWS
  Translate, Azure Translator, plus a null driver for tests.
- Helper overrides: `t()`, `__()`, `trans()`, `trans_choice()` — full Laravel
  API preserved (placeholders, plurals, array returns, dot notation, JSON
  files).
- `#[Translatable]` attribute for Eloquent property translation.
- `HasTranslations` trait for models with translated columns.
- RTL-aware via `Language.direction` _(later refactored \u2014 see Wave 5 entry
  above where the field moves to `PlatformLanguage.direction` as an accessor
  chaining through geography)_.
- Entitlements for locale count + monthly AI translation quota.

### Compatibility

- Depends on `foundation`, `tenants`, `activity`, `entitlements`.
- Inception release.
