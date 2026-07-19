# crm-leads — changelog

## [Unreleased] — inception (Wave 3)

- Three entities: Lead / LeadActivity / Task.
- Auto-assign via `AutoAssignLead` (round-robin among active sales users).
- Overdue task alerts via `AlertOverdueTasksJob`.
- Attribution integration — every lead captures `source` + optional
  `campaign_id`.
- 9 events including `LeadCaptured`, `LeadConverted`, `TaskOverdue`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `athlete`, `marketing`,
  `attribution`, `notifications`.

### ULID prefixes

- `lea_`, `lac_`, `tsk_` — registered.
