# announcements

Academy news feed per blueprint §16.2. Wave 2 comms.

## Owned entities

- `Announcement` (`ann_`) — targeted news item with audience scope + schedule.
- `AnnouncementView` (`anv_`) — per-user view + acknowledgement.

## Audience targeting

- `tenant` — everyone in the tenant.
- `organization` — all users in the org.
- `branch` — users placed at the branch.
- `team` — users on the team's roster.
- `role` — users holding the role (e.g. all coaches).

## Distinction

- **Announcements** = targeted org/branch/team/role news feed (tenant-internal).
- **Newsletter** (`notifications/newsletter`) = subscription-list broadcast
  (marketing/opt-in).

## ULID prefixes

- `ann_`, `anv_`
