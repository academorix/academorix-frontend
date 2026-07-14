# notifications-in-app — changelog

## [Unreleased] — inception

- In-app channel authored as a thin wrapper around Laravel Reverb.
- Registers `in_app` with core's `NotificationChannelRegistry`.
- One job: `BroadcastInAppNotificationJob`.
- Two error codes: `NOTIFICATIONS_INAPP_BROADCAST_FAILED`, `NOTIFICATIONS_INAPP_REVERB_UNREACHABLE`.
- Kill switch: `notifications.in-app.broadcast` (default on). Off = DB-only writes.
- Health probe: `notifications-in-app-reverb-reachable`.

### Compatibility

- Depends on `notifications` (core) + `foundation` + `tenancy`. No downstream extensions.
- No breaking change surface \u2014 inception release.
