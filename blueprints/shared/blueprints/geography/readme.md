# geography

Global reference catalog + IP geolocation. Wraps
[`nnjeim/world`](https://github.com/nnjeim/world). Wave 5 infrastructure.

## 1. What this module owns

| Concern                                                               | Owned artefact                                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Country catalog (ISO-3166 alpha-2 / alpha-3 + phone + emoji + region) | `Country` model (subclasses `Nnjeim\World\Models\Country`)                                            |
| State / province catalog                                              | `State` model                                                                                         |
| City catalog                                                          | `City` model                                                                                          |
| Currency catalog (ISO-4217 code + symbol + precision)                 | `Currency` model                                                                                      |
| Language catalog (ISO-639-1 + native name + `is_rtl`)                 | `Language` model                                                                                      |
| Timezone catalog (IANA name + country)                                | `Timezone` model                                                                                      |
| IP → location resolver                                                | `GeolocateService` binding                                                                            |
| Locale-aware country names                                            | `HasWorldLocalizedName` trait                                                                         |
| Response cache (1h TTL, tenant-agnostic)                              | `geography.cache` middleware                                                                          |
| MaxMind GeoLite2 refresh (weekly)                                     | `RefreshMaxMindDatabaseJob`                                                                           |
| AI Tools for LLM callers                                              | `FindCityTool`, `GetLanguageTool`, `GetTimezoneOffsetTool`, `ListCountriesTool`, `ListCurrenciesTool` |

## 2. Vendor boundary — who owns what

`nnjeim/world` owns:

- **Migrations** for the six tables (`countries`, `states`, `cities`,
  `currencies`, `languages`, `timezones`). This module ships **no migrations**
  for those tables.
- **Seeder** — one shot via `php artisan world:install` at bootstrap. Populates
  ~250 countries, ~5000 states, ~150k cities, ~250 currencies, ~200 languages,
  ~400 timezones.
- **Country name translations** in 23 locales at
  `resources/lang/vendor/world/{locale}/country.php` (keyed by uppercase ISO2,
  e.g. `world::country.FR` → "France" in the requested locale).
- **Geolocation** implementation with MaxMind GeoLite2 primary + ip-api.com
  fallback.

We own:

- **Subclass models**
  (`Stackra\Geography\Models\{Country, State, City, Currency, Language, Timezone}`)
  rebinding via `config('world.models.*')` in
  `GeographyServiceProvider::register()`. Vendor relations (`Country::states`,
  `State::cities`, ...) return our subclasses.
- **Data DTOs** with locale-aware `name` + stable `english_name` alongside.
- **Repository interfaces + Eloquent implementations** so controllers depend on
  contracts.
- **Services** — one per entity plus `GeolocateService` wrapping the vendor's
  raw payload into typed DTOs with localized country name.
- **Controllers + Policies + Observers + Events + Listeners** — full standard
  blueprint.
- **Response cache middleware** (`geography.cache`).
- **AI Tools** — LLM-facing callable adapters over the read surface.

## 3. Locale resolution

Country name display order:

1. `?locale=fr` query parameter on the request
2. `X-Locale` header (via `world.locale` middleware alias)
3. `Accept-Language` header best-match
4. `app()->currentLocale()` (Laravel default)
5. English fallback from the DB `name` column

Only country names are translated (vendor limitation). State / city / currency /
language / timezone names remain English. Adding per-entity translation catalogs
later is additive — same module.

## 4. Public read surface

Every list route supports the standard foundation query envelope via
`spatie/laravel-query-builder`:

- `?filter[region]=Europe`
- `?filter[iso2]=FR`
- `?filter[status]=1`
- `?sort=name` / `?sort=-name`
- `?include=states,currency,timezones`
- `?per_page=50`
- `?locale=fr`

Reads are **PUBLIC** (no `auth:sanctum`). Reference data every UI needs
including anonymous marketing pages and signup flows. `viewAny`/`view` policies
accept a nullable Authenticatable so the auth gate never fires. The
`geography.cache` middleware wraps every catalog GET response in Redis for 1h
TTL, keyed by `(path + query + locale)`. Anonymous bursts are cheap.

## 5. IP geolocation

`GET /api/v1/geography/geolocate[?ip=1.2.3.4]` returns `GeolocationData`:

```json
{
  "data": {
    "ip": "1.2.3.4",
    "country_code": "FR",
    "country_name": "France",
    "state_code": "75",
    "state_name": "Île-de-France",
    "city_name": "Paris",
    "postal_code": "75001",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "timezone": "Europe/Paris",
    "accuracy_radius": 1000
  }
}
```

- **Auth required** (`auth:sanctum`)
- **Rate limit**: 10 req/min per user (configurable via
  `geography.geolocate.rate_limit.per_minute`)
- **Cache**: per `(ip, locale)` for 1h in Redis
- **Primary**: MaxMind GeoLite2 local DB
  (`storage/app/geoip/GeoLite2-City.mmdb`)
- **Fallback**: `ip-api.com` public API (free tier 45 req/min per source IP)

Enable the MaxMind path by:

```bash
MAXMIND_LICENSE_KEY=xxx php artisan geography:refresh-maxmind
```

The weekly `RefreshMaxMindDatabaseJob` keeps the DB fresh (scheduled Sunday
03:00 UTC).

## 6. `HasWorldLocalizedName` trait

Mixed into `Country`. Adds:

- `$country->localized_name` — accessor for `resolveLocalizedName()` at current
  locale
- `$country->resolveLocalizedName('fr')` — explicit locale override
- Falls back to `$country->name` (English DB row) when the translation key is
  missing

The trait is applied to `Country` only today. Applying it to other entities is a
no-op until vendor ships translations for those catalogs.

## 7. Tenant preferences

Tenancy don't own reference-catalog rows. They express **preferences** via
settings:

- `default_country_code` — ISO2 for signup / form defaults
- `default_currency_code` — ISO-4217 for pricing display
- `default_timezone` — IANA name for date rendering
- `default_language_code` — ISO-639-1 for content authoring (distinct from
  `localization` module's active-locale enablement)

These live in `tenant_settings` via the standard `settings` module contract.

## 8. AI Tools

The `contributes.ai_tools` map registers callable adapters usable by LLM-driven
flows (chat, form autofill, admin assistants). Each tool wraps a repository
method with a strict input schema so the LLM cannot inject SQL or bypass
policies.

- `ListCountriesTool` — filter + sort catalog for dropdown backing
- `FindCityTool` — search cities by name + state / country
- `GetLanguageTool` — resolve an ISO-639-1 tag to full display metadata
- `GetTimezoneOffsetTool` — return IANA name + current UTC offset
- `ListCurrenciesTool` — filter + sort currencies for pricing UIs

## 9. Naming disambiguation

`geography::Language` is the global ISO-639 catalog wrapping `nnjeim/world`'s
languages table (200+ rows with fields like `native`, `is_rtl`, `country_id`,
`dir`). It is the single source of truth for ISO-639 language metadata across
the whole platform. Since Wave 5, the localization module no longer duplicates
this catalog: `localization::PlatformLanguage` (previously
`localization::Language`, table `platform_languages`) now REFERENCES it via a
NOT-NULL FK on `geography_language_id`, plus an optional FK on
`geography_country_id` for regional variants (`fr-CA`, `en-GB`, `pt-BR`).

| Namespace                        | Purpose                                                                      | Rows          | Route                             |
| -------------------------------- | ---------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `geography::Language`            | ISO-639 reference (name / native / direction / is_rtl); vendor-seeded        | 200+ (seeded) | `GET /api/v1/geography/languages` |
| `localization::PlatformLanguage` | Platform-approved BCP 47 tags + script + beta flags; FK-references geography | ~40 (curated) | `GET /api/v1/languages`           |

Rule of thumb: reference lookups (signup / profile dropdown, "author writes in
which language?", "content language of this document") → `geography::Language`.
Tenant locale enablement + translation subsystem + platform activation flags →
`localization::PlatformLanguage` (which chains through to `geography::Language`
via accessors so display fields stay identical).

## 10. Files

Standard blueprint. No `data/` seed (vendor owns it); one seed-info doc pointing
at `world:install`.

## 11. What this module does NOT do

- **Doesn't own tenant-scoped rows.** Reference-catalog data is global.
- **Doesn't own translation of state/city/currency/language/timezone names.**
  Vendor only ships country translations.
- **Doesn't run migrations for its own tables.** `world:install` does.
- **Doesn't do address parsing / geocoding.** That's a downstream module
  (`addresses`, not yet built) — this module answers "what does ISO2=FR mean"
  and "which country does 1.2.3.4 resolve to", not "parse this street address".
