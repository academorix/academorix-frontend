# geography — changelog

## [Unreleased] — inception

- Geography module authored. Wraps `nnjeim/world` for six reference entities
  (Country, State, City, Currency, Language, Timezone) + IP geolocation.
- Public read routes (no auth required) — reference data every UI needs.
- Authenticated + rate-limited `/geolocate` endpoint (10 req/min default).
- MaxMind GeoLite2 primary path with `ip-api.com` fallback via vendor service.
- Locale-aware country names via `HasWorldLocalizedName` trait (23 vendor
  locales).
- Response cache middleware (`geography.cache`) — 1h TTL keyed by
  `(path, query, locale)`.
- Weekly `RefreshMaxMindDatabaseJob` schedule (Sunday 03:00 UTC).
- AI Tools: `FindCityTool`, `GetLanguageTool`, `GetTimezoneOffsetTool`,
  `ListCountriesTool`, `ListCurrenciesTool`.
- Vendor owns migrations / seeder / country translations; we ship subclass
  models rebinding via `config('world.models.*')`.

### Compatibility

- Depends on `foundation`.
- Optional consumer of `localization` (fires `GeolocationResolved` with resolved
  country + timezone hints).
- Inception release.
