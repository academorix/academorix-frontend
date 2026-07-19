# awards — changelog

## [Unreleased] — inception (Wave 4)

- Two entities: Award / Certificate.
- Auto-grant subscribers on 6 domain events (belt / streak / benchmark / goal /
  competition / motm).
- Signed-URL public sharing of certificates with configurable expiry.
- 5 events including `AwardGranted`, `CertificateIssued`,
  `AutoGrantRuleTriggered`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `athlete`,
  `athlete-enrollment`, `attendance`, `event`, `progress`, `performance`,
  `development`, `storage`, `notifications`.

### ULID prefixes

- `awd_`, `crt_` — registered.
