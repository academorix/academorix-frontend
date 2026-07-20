# private-sessions — changelog

## [Unreleased] — inception (Wave 2)

- Two entities: PrivateSessionRequest / SessionCredit.
- Atomic credit consumption in same DB txn as session completion.
- 10 events including `CreditConsumed`, `SessionNoShow`, `CreditPackPurchased`.
- Charges invoice via `finance/invoice` when no credit available.

### Dependencies

- `foundation`, `tenancy`, `application`, `athlete`, `coaching`, `session`,
  `invoice`, `payment`, `notifications`.

### ULID prefixes

- `psq_`, `scr_` — registered.
