# platform/staff — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; CRUD + attendance pending

## What landed

- `Staff` model + `StaffInterface` — wraps a `User` (per-tenant) with
  employment metadata: `employee_id`, `job_title`,
  `employment_type` (full-time / part-time / contract),
  `employment_start_at`, `employment_end_at`, `hourly_rate_minor`.
- `StaffRole` — the role (`coach`, `receptionist`, `admin_assistant`,
  `medical`) — pivot to the underlying `User.roles` via
  `access/rbac`.

## What's pending

### Actions to complete

- Full CRUD — `CreateStaff`, `UpdateStaff`, `ShowStaff`,
  `ListStaff`, `TerminateStaff` (soft-delete with
  `employment_end_at`).
- `AttachRole` (POST `/{staff}/roles`) — grant a staff role +
  cascade to the underlying User's spatie role assignments.
- `DetachRole` — revoke.
- `AttendanceSummary` (GET `/{staff}/attendance-summary`) —
  aggregated shift + break hours over a date range.

### Services

- `StaffProvisioner` — the "hire" orchestrator. Creates the `User`
  row (or attaches to an existing Identity), creates the `Staff`
  row, attaches the default role catalogue for the tenant's
  `business_type`, fires `StaffProvisioned`.
- `StaffTerminator` — the "termination" orchestrator. Sets
  `employment_end_at`, revokes every role, marks the underlying
  `User` inactive, but keeps the row for audit + payroll.

### Domain events

- `StaffProvisioned` / `StaffTerminated` / `StaffRoleAttached` /
  `StaffRoleDetached` / `StaffUpdated`.

### Cross-module dependencies

- **`identity/user`** — `Staff.user_id` references User.
- **`access/rbac`** — role attachment mutates spatie's
  `role_has_users` for the staff's User.
- **`sports/coaching`** — the Coach aggregate wraps `Staff` with
  sport-specific fields (certifications, specialties).
- **`finance/payment`** — payroll module reads staff hourly rates +
  attendance to compute paychecks.

## Backlog priorities

1. **P0 — Full CRUD.**
2. **P0 — Provisioner + terminator orchestrators.**
3. **P1 — Attendance summary.**
