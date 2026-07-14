# geography — seed-info

Geography does NOT ship its own data seed. The vendor package [`nnjeim/world`](https://github.com/nnjeim/world) owns migrations, tables, and the seeder for all six entities.

## One-shot install

Run once at app bootstrap:

```bash
php artisan world:install
```

This populates:

- `countries` — ~250 rows (ISO-3166 alpha-2 / alpha-3 + phone code + emoji + region + subregion)
- `states` — ~5,000 rows (ISO-3166-2 states / provinces / regions)
- `cities` — ~150,000 rows (city name + state_id + country_id + coarse lat/lng)
- `currencies` — ~250 rows (ISO-4217 code + symbol + precision + country association)
- `languages` — ~200 rows (ISO-639-1 code + native name + `is_rtl` + `dir`)
- `timezones` — ~400 rows (IANA name + country_code)

## Force re-seed

Destructive — truncates + repopulates:

```bash
php artisan world:install --force
```

Platform-admin overrides (rows with `updated_by IS NOT NULL`) are preserved by the `geography:reconcile-vendor` command run afterwards.

## Country name translations

Vendor ships translations for **23 locales** at `resources/lang/vendor/world/{locale}/country.php` keyed by uppercase ISO2:

- `ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `nl`, `pl`, `pt`, `ru`, `tr`, `zh` (and 10 more)

Adding a locale = drop a matching `resources/lang/vendor/world/<locale>/country.php` in your app root + add the locale to `config('geography.accepted_locales')` (which becomes `config('world.accepted_locales')` at boot via override).

## MaxMind GeoLite2

For local IP geolocation, provision the DB:

```bash
export MAXMIND_LICENSE_KEY=xxx   # register free at maxmind.com
php artisan geography:refresh-maxmind
```

Writes to `storage/app/geoip/GeoLite2-City.mmdb`. Refreshed weekly by the `RefreshMaxMindDatabaseJob` schedule.

## Reconciling after a vendor update

When `nnjeim/world` releases a new version with updated rows (e.g. a country ISO code change):

```bash
composer update nnjeim/world
php artisan geography:reconcile-vendor --dry-run   # report drift
php artisan geography:reconcile-vendor --fix       # apply, preserving platform overrides
```
