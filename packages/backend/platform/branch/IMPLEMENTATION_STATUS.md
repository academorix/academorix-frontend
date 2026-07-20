# platform/branch — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; CRUD actions pending

## What landed

- `Branch` model + `BranchInterface` — the physical venue. Carries `tenant_id` +
  `organization_id` + `region_id` (per the three-axes hierarchy — Branch is
  where Organization × Region meet), address fields (`street`, `city`,
  `country`, `latitude`, `longitude`), `timezone`, `status`, `is_default`.
- `BlackoutPeriod` — per-branch operational blackouts (closures for holidays,
  maintenance).
- `OpeningHours` — day-of-week + open/close time bracket. One row per branch per
  weekday.

## What's pending

### Actions to complete

- Full CRUD — `CreateBranch`, `UpdateBranch`, `ShowBranch`, `ListBranches`,
  `DeleteBranch` (soft-delete + archived state).
- `SetDefaultBranch` — one branch per tenant is the "default" — used as the
  fallback for team + facility + booking rows that don't specify a branch.
- `IsBranchOpenAction` (GET `/{branch}/is-open`) — reads the opening hours +
  active blackouts + current time (in the branch's timezone) and returns
  `is_open` + `next_open_at`. Consumers: the frontend "is my branch open right
  now" indicator, the booking action's "can I book right now" precondition.
- `AddBlackout` / `RemoveBlackout` — blackout period management.

### Services

- `BranchOpeningHoursResolver` — reads the day-of-week + timezone and computes
  the next open/close boundary. Consumer: the IsBranchOpenAction + the booking
  system.
- `TenantDefaultBranchProvisioner` — listens to `TenantProvisioning` (from
  `platform/tenancy`) and creates the default branch atomically.

### Domain events

- `BranchCreated`, `BranchUpdated`, `BranchArchived`, `BranchDefaultChanged`,
  `BlackoutAdded`, `BlackoutRemoved`.

### Cross-module dependencies

- **`platform/tenancy`** — listens to `TenantProvisioning` for default-branch
  creation.
- **`platform/facility`** — Facility.branch_id references Branch.
- **`sports/teams`** — Team.branch_id references Branch.
- **`billing/subscription`** — Subscription entitlements gate `branch_slot`.

## Backlog priorities

1. **P0 — Full CRUD** (unblocks tenant onboarding).
2. **P0 — Default-branch provisioner** (blocks tenant provisioning completion).
3. **P1 — Opening hours + blackouts + `IsBranchOpen`.**
