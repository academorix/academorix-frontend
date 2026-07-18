# localization — changelog

## [Unreleased] — wave 5 build

- Localization module scaffolded per the blueprint. Four aggregate roots:
  `PlatformLanguage`, `TenantLocale`, `Translation`, `TranslationJob`.
- `PlatformLanguage` FK-references `geography::Language` + optional
  `geography::Country` — ISO-639 + ISO-3166 metadata is READ from geography,
  never duplicated locally.
- Table `platform_languages` avoids collision with the vendor-owned
  `languages` table shipped by `nnjeim/world` (geography).
- Composite unique index on
  `(geography_language_id, geography_country_id, script)` guards against
  duplicate PlatformLanguage rows for the same effective locale.
- Locale resolution middleware (`locale.resolve`) implements the 7-step
  precedence chain via a `LocaleResolver` service driving pluggable
  `LocaleResolutionStrategy` implementations discovered via
  `#[AsLocaleResolutionStrategy]`.
- Translator decoration — our
  `Academorix\Localization\Services\CachedTranslator` extends
  `Illuminate\Translation\Translator` and overrides `get()` + `choice()`
  to consult the DB cache first via `TranslationRepositoryInterface`.
- Six machine-translation drivers (OpenAI, Google, DeepL, AWS Translate,
  Azure, Null) discovered via `#[AsTranslatorDriver('name')]` and resolved
  through `TranslatorDriverManager` (extends Laravel's `Manager`).
- Redaction hook runs source strings through the shared telemetry
  redactor before dispatching to any driver.
- `#[Translatable]` property attribute + `HasTranslations` trait (composing
  `Spatie\Translatable\HasTranslations`) for Eloquent per-row content
  translation.
- Two validation rules: `ValidBcp47Tag`, `ValidIso639Code`.
- Three enum casts: `LocaleCode`, `TextDirection`, `TranslationSource`.
- Seven Artisan commands: `localization:list-locales`,
  `localization:describe`, `localization:translate`,
  `localization:warm-cache`, `localization:bulk-translate`,
  `localization:seed-platform-languages`, `localization:reconcile-cache`.
- Five queued jobs: `TranslateJob`, `BulkTranslateNamespaceJob`,
  `WarmTranslationCacheJob`, `PruneStaleTranslationsJob`,
  `ReconcileTranslationCacheJob`.
- Three notification classes: `TranslationJobCompletedNotification`,
  `TranslationJobFailedNotification`,
  `MachineTranslationQuotaApproachingNotification`.

### Compatibility

- Depends on `academorix/foundation`, `academorix/tenancy`,
  `academorix/activity`, `academorix/entitlements`,
  `academorix/geography` (adds ISO reference data at priority 65).
- Inception release.
