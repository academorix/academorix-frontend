# shared/geography — Phase 3 implementation status

## Status: SCAFFOLDED — country + region + city + timezone models landed; seeders + Actions pending

## What landed

- **`Country`**, **`Region`** (administrative subdivision, distinct from
  tenant-`Region`), **`City`**, **`Timezone`** models.
- Attribute-first migrations with lookup indexes on ISO codes.
- Enum types (`ContinentEnum`, `CountryStatus`).
- Factories.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete (all read-only, cached lookup)

- **`ListCountryAction`** — GET `/countries`. Static reference data — long TTL
  cache.
- **`ShowCountryAction`** — GET `/countries/{iso2}`.
- **`ListRegionAction`** — GET `/countries/{iso2}/regions`.
- **`ListCityAction`** — GET `/regions/{id}/cities`.
- **`ListTimezoneAction`** — GET `/timezones`. IANA tz database slice.
- **`CurrentTimezoneAction`** — GET `/timezones/current`. Derived from the
  user's `identity.timezone` OR the active branch's timezone.
- **`GeocodeAction`** — POST `/geography/geocode`. Text address → (lat, lng) via
  a driver (Google Maps / Mapbox / OSM Nominatim). Not currently a priority; the
  FE can defer geocoding.

### Services to complete

- **`GeographyCache`** — 7-day cache for the reference lookup responses (country
  / region / city sets).
- **`TimezoneResolver`** — user → branch → tenant → global default cascade.

### Seeders

- **`CountrySeeder`** — 250-ish ISO 3166-1 alpha-2 codes with names, currency
  default, phone code.
- **`TimezoneSeeder`** — IANA tz database.
- **`CitySeeder`** — top ~5000 cities per major country. Optional per tenant
  (many tenants don't need this).

### Cross-module dependencies

- **`platform/branch`** — branch's `country_id` FK.
- **`platform/region`** — the tenant-`Region` may reference the
  geography-`Country` for currency defaults.
- **`identity/user`** — `user.country_id` / `user.timezone` FK.
- **`finance/tax`** — tax-jurisdiction resolution keys off `country_id` +
  `region_id`.

## Backlog priorities

1. **P0 — `CountrySeeder` + `TimezoneSeeder`** — every downstream package needs
   these.
2. **P0 — `ListCountryAction` + `ListTimezoneAction`** — bind the FE dropdowns.
3. **P1 — `CurrentTimezoneAction`** — user-preference cascade.
4. **P2 — `GeocodeAction`** — the FE can gather addresses without geocoding for
   launch.
5. **P2 — `CitySeeder`** — large seed; can defer.
