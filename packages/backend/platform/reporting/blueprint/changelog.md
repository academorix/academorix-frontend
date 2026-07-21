# reporting — changelog

## [Unreleased] — inception (Wave 3)

- Four entities: ReportDefinition / SavedReport / ReportRun / Dashboard.
- Cross-region rollup via reporting-currency FX conversion.
- Role-scoped audience filters (owner/branch_manager/hr/finance/coach/public).
- Retention: ReportRun 90d unless attached to a Dashboard.
- 7 events + 3 scheduled delivery cadences (weekly / monthly / quarterly).

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `storage`, `search`,
  `analytics`, `invoice`, `payment`, `attendance`, `membership`, `athlete`,
  `athlete-enrollment`, `coaching`, `staff`.

### ULID prefixes

- `rpt_`, `svr_`, `rre_`, `dsh_` — registered.
