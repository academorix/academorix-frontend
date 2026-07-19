# expenses — changelog

## [Unreleased] — inception (Wave 2)

- Six entities: Expense / ExpenseCategory / PayrollRun / PayrollLine / Budget /
  CostCenter.
- Receipt attachment via `storage/files` FK — required for full audit
  traceability.
- Recurring expense auto-generation via nightly job.
- Multi-branch payroll allocation per D2 locked (delivered sessions per branch).
- 8 events including `RecurringExpenseGenerated`, `PayrollRunCompleted`,
  `BudgetExceeded`.

### Dependencies

- `foundation`, `tenancy`, `application`, `staff`, `branch`, `region`,
  `storage`, `invoice`, `payment`, `notifications`, `integrations`.

### ULID prefixes

- `exp_`, `exc_`, `plr_`, `pll_`, `bdg_`, `ctr_` — registered.
