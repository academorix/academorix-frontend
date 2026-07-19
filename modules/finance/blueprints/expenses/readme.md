# expenses

Money-out + payroll per blueprint §10.19. Wave 2 finance module.

## Owned entities

- `Expense` (`exp_`) — money-out with attached receipt Document.
- `ExpenseCategory` (`exc_`) — tenant taxonomy.
- `PayrollRun` (`plr_`) — periodic payroll job.
- `PayrollLine` (`pll_`) — per-staff line with branch allocations (D2 locked).
- `Budget` (`bdg_`) — per-branch/category budget tracking.
- `CostCenter` (`ctr_`) — optional grouping for analytics.

## V1 is intentionally simple

Deliberately manual expense tracking. Automated operational-cost + profitability
analysis (per-session cost, session profitability, cash-in vs cash-out) is
FUTURE VISION not v1 — introduced once Facilities pricing + coach rates are
validated and there's demand.

## Multi-branch payroll allocation (D2 locked)

A staff member delivering sessions across N branches has their pay split by
**sessions delivered per branch** during the payroll period.
`PayrollLine.branch_allocations` carries `[{branch_id, ratio, amount_minor}]` so
reporting can slice per branch.

## Cascades

- Every approved expense strongly recommended to carry `receipt_document_id`.
- Recurring expense (rent) auto-generates a new instance each period via
  `GenerateRecurringExpensesJob`.
- Payroll references delivered sessions from `sports/attendance`.

## ULID prefixes

- `exp_`, `exc_`, `plr_`, `pll_`, `bdg_`, `ctr_`
