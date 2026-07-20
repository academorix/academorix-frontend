# academorix/geography

Global reference catalog + IP geolocation. Wraps
[`nnjeim/world`](https://github.com/nnjeim/world). Wave 5 infrastructure.

## What this module owns

| Concern                                                               | Owned artefact                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Country catalog (ISO-3166 alpha-2 / alpha-3 + phone + emoji + region) | `Country` model (subclasses `Nnjeim\World\Models\Country`) |
| State / province catalog                                              | `State` model                                              |
| City catalog                                                          | `City` model                                               |
| Currency catalog (ISO-4217 code + symbol + precision)                 | `Currency` model                                           |
| Language catalog (ISO-639-1 + native name + `is_rtl`)                 | `Language` model                                           |
| Timezone catalog (IANA name + country)                                | `Timezone` model                                           |
| IP → location resolver                                                | `GeolocateServiceInterface` + `MaxMindGeolocateService`    |
| Locale-aware country names                                            | `HasWorldLocalizedName` trait                              |
| Response cache (1h TTL, tenant-agnostic)                              | `geography.cache` middleware                               |
| MaxMind GeoLite2 refresh (weekly)                                     | `RefreshMaxMindDatabaseJob`                                |

## Vendor boundary — who owns what

`nnjeim/world` owns migrations, the seeder (one shot via
`php artisan world:install`), country-name translations for 23 locales, and the
raw geolocation implementation (MaxMind GeoLite2 primary + ip-api.com fallback).

This module owns:

- **Subclass models** rebinding `config('world.models.*')` in the service
  provider's `#[OnRegister]` hook so vendor relations return our subclasses.
- **Data DTOs** with locale-aware `name` + stable `english_name`.
- **Repository interfaces + Eloquent implementations** (attribute-first).
- **Services** — `GeolocateServiceInterface` + `MaxMindGeolocateService`.
- **Actions + Policies + Observers + Events + Listeners** — standard blueprint.
- **Response cache middleware** — `geography.cache`.

## Non-tenant-scoped

Reference-catalog data is global. No `tenant_id` on any of the six entities.
Tenancy may express preferences via settings (`default_country_code`,
`default_currency_code`, `default_timezone`, `default_language_code`) but never
own reference-catalog rows.

## Public read surface

Every list route supports the foundation query envelope via
`spatie/laravel-query-builder`:

- `?filter[region]=Europe`
- `?filter[iso2]=FR`
- `?filter[status]=1`
- `?sort=name` / `?sort=-name`
- `?include=states,currency,timezones`
- `?per_page=50`
- `?locale=fr`

Reads are PUBLIC (no `auth:sanctum`). `viewAny` / `view` policies accept
nullable `Authenticatable` so anonymous requests pass. The `geography.cache`
middleware wraps every catalog GET in Redis for 1h TTL, keyed by
`(path + query + locale)`.

## IP geolocation

`GET /api/v1/geography/geolocate[?ip=1.2.3.4]` — authed, rate-limited (10
req/min per user default), cached per `(ip, locale)` for 1h. Falls back from
MaxMind GeoLite2 to ip-api.com; returns `data:null` when both fail.

Enable the MaxMind path with:

```bash
MAXMIND_LICENSE_KEY=xxx php artisan geography:refresh-maxmind
```

The weekly `RefreshMaxMindDatabaseJob` keeps the DB fresh.

## Cross-module relationship

Since Wave 5, the `localization::PlatformLanguage` model references (does not
duplicate) `geography::Language` via `platform_languages.geography_language_id`
(NOT NULL, restrict) plus an optional FK to `geography::Country` for regional
variants (`fr-CA`, `en-GB`, `pt-BR`).

Callers pick by intent:

- Reference lookups (dropdowns, forms, country / language pickers) →
  `geography::Language`.
- Tenant locale enablement + platform beta flags →
  `localization::PlatformLanguage` (which chains through to geography for
  display fields via accessors).
