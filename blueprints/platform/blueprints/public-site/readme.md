# public-site

Tenant public-facing pages + CMS per blueprint §16.9. Wave 4.

## Owned entities

- `PublicPage` (`pge_`) — slug + SEO + published state.
- `ContentBlock` (`cnb_`) — reusable block (hero / text / gallery / CTA /
  widgets).

## Registration entry

The `registration_form` content block on any published page mounts the
enrollment form, feeding `sports/registrations`. Conversion tracked via
`growth/attribution`.

## Public read-models

- `GET /public/results` — recent match results.
- `GET /public/standings` — league tables (per Competition).
- `GET /public/teams/{team}` — team page with roster (opt-in).

Every public read applies branding from `platform/branding` + SEO metadata from
the PublicPage.

## ULID prefixes

- `pge_`, `cnb_`
