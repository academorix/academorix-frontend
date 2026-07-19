# reporting

Cross-module analytics + dashboards per blueprint §16.7. Wave 3.

## Owned entities

- `ReportDefinition` (`rpt_`) — analytics definition (SQL template + params
  schema).
- `SavedReport` (`svr_`) — user-saved parameterization + delivery schedule.
- `ReportRun` (`rre_`) — materialized output referencing storage::File.
- `Dashboard` (`dsh_`) — widget-composed KPI grid.

## Cross-region rollup

`AggregateCrossRegionInReportingCurrency` hook — reports that span multiple
Region rows convert monetary columns via `CurrencyConverter` using
FX-rate-at-transaction-time (per hierarchy.md §2.1 locked policy).

## Role scoping

Reports carry `audience_scope`:

- `tenant_admin` — owner sees all branches.
- `branch_manager` — filters to the manager's active branches.
- `hr` — visibility limited to staff/coaching cross-cuts.
- `finance` — revenue / expenses / dunning.
- `coach` — the coach's own teams/athletes.
- `public` — read-only public read-model.

## ULID prefixes

- `rpt_`, `svr_`, `rre_`, `dsh_`
