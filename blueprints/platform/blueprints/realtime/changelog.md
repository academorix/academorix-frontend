# realtime — changelog

## [Unreleased] — inception (Wave 0)

- Realtime module authored. Three owned entities:
  - `BroadcastChannel` (`bch_`) — attribute-registered channel definition.
  - `BroadcastSubscription` (`bsn_`) — WS subscription state machine.
  - `Presence` (`prs_`) — ephemeral online-user roster.
- Attribute-driven channel discovery via `#[AsBroadcastChannel]`.
- `TenantBoundaryEnforcer` middleware refuses cross-tenant broadcast + subscribe
  attempts.
- Reverb wired at `broadcasting.connections.reverb` — feature-flag
  `realtime.enabled` gates whole subsystem.
- 7 published events: `BroadcastChannelRegistered`, `SubscriptionAuthorized`,
  `SubscriptionRefused`, `SubscriptionDisconnected`, `PresenceJoined`,
  `PresenceLeft`, `PresenceHeartbeat`.
- Retention: BroadcastSubscription auto-purged 30 days after disconnected;
  Presence rows evicted 15m after last heartbeat; BroadcastChannel retained
  indefinitely (config).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `auth`.
- Extended by NONE. Planned consumers: attendance, event, session, competition,
  messaging, announcements, notifications, notifications-in-app, ai.

### ULID prefix registration

- `bch_`, `bsn_`, `prs_` — registered in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
