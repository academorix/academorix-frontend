# announcements — changelog

## [Unreleased] — inception (Wave 2)

- Two entities: Announcement / AnnouncementView.
- Audience scopes: tenant/organization/branch/team/role.
- Scheduled publishing via PublishScheduledAnnouncementsJob.
- Realtime fanout via `tenant.{tenantId}.announcements` broadcast channel.
- 7 events including `AnnouncementPublished`, `AnnouncementAcknowledged`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `notifications`, `realtime`,
  `storage`.

### ULID prefixes

- `ann_`, `anv_` — registered.
