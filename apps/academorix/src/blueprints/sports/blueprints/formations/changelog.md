# formations — changelog

## [Unreleased] — inception (Wave 3)

- Two entities: Formation / FormationSlot.
- Slot count validated vs sport-config team_size on save.
- Platform defaults seeded for football (4-3-3 / 4-4-2 / 3-5-2), basketball
  (triangle-offense / zone-2-3), tennis (singles), swimming (lane-8).

### Dependencies

- `foundation`, `tenancy`, `application`, `registry`, `coaching`.

### ULID prefixes

- `frm_`, `fsl_` — registered.
