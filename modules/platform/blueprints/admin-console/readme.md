# admin-console

Tenant admin dashboard + platform-staff console per blueprint §16.4. Wave 2.

## Owned entities

- `AdminDashboardConfig` (`adc_`) — per-user or per-tenant dashboard layout +
  widget selection.

## Two audiences

**Tenant admin (sanctum)** — owner/admin see cross-module dashboards:

- Revenue widget (finance/reporting)
- Athlete count widget
- Attendance rate widget
- Recent activity widget (activity feed)
- Announcement composer widget

**Platform staff (platform_admin)** — Academorix ops see:

- Tenant provisioning + billing overview
- System health dashboard
- Impersonation gate (delegates to `access/delegation` + audit)
- Cross-tenant search

## Impersonation

`POST /platform/console/tenants/{tenant}/impersonate` creates an impersonation
session via `access/delegation` module. Every request under impersonation
carries `X-Impersonating-User` header + is audit-material with the operator's
identity.

## ULID prefixes

- `adc_`
