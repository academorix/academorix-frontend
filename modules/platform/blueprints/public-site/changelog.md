# public-site — changelog

## [Unreleased] — inception (Wave 4)

- Two entities: PublicPage / ContentBlock.
- 8 content block kinds (hero / text / gallery / CTA / testimonials /
  results_widget / roster_widget / registration_form).
- Auto sitemap + robots.txt generation.
- Edge caching with `PagePublished` invalidation.
- Search-indexed for on-site content search.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `branding`, `storage`,
  `event`, `competition`, `notifications`.

### ULID prefixes

- `pge_`, `cnb_` — registered.
