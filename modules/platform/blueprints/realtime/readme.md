# realtime

The WebSocket transport substrate. Wave 0 foundational module — every live
update in Academorix flows through here.

## 1. What this module owns

| Concern              | Owned artefact                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Registered channel   | `BroadcastChannel` (`bch_`) — namespace + type (public/private/presence) + authorization callback FQCN.                       |
| Subscription state   | `BroadcastSubscription` (`bsn_`) — active WS subscription of a User to a channel; state pending_auth → active → disconnected. |
| Live presence roster | `Presence` (`prs_`) — ephemeral Redis-backed row per (channel, user) with periodic snapshot.                                  |

## 2. The tenant boundary

Every channel namespace MUST start with `tenant.{tenantId}.` (enforced by
`TenantBoundaryEnforcer` middleware at broadcast + subscribe time). Cross-tenant
broadcasts are refused with `403 REALTIME_CROSS_TENANT_REFUSED`.

Platform-plane broadcasts use `platform.*` prefix and require `platform_admin`
guard.

## 3. Attribute-driven channel registration

Domain modules declare channels via `#[AsBroadcastChannel]`:

```php
#[AsBroadcastChannel(
    namespace: 'tenant.{tenantId}.attendance',
    type: 'private',
    authorize: [AttendanceChannelAuth::class, 'authorize']
)]
final class AttendanceChannel { /* … */ }
```

Boot-time discovery registers the channel in `BroadcastChannelRegistry` +
attaches the authorization callback to Reverb.

## 4. Downstream consumers

Modules that broadcast on realtime channels:

- `attendance` → `tenant.{id}.attendance` (private) — live check-in feed for
  coaches.
- `event` → `tenant.{id}.events.{eventId}` (private) — RSVP counts, lineup
  publish.
- `competition` → `tenant.{id}.standings.{competitionId}` (public) — league
  table updates.
- `messaging` → `tenant.{id}.conversation.{conversationId}` (presence) — DM
  presence + typing indicators.
- `announcements` → `tenant.{id}.announcements` (public) — instant announcement
  dispatch.
- `notifications-in-app` → `user.{userId}.notifications` (private) — per-user
  notification stream.
- `ai` → `user.{userId}.ai.{conversationId}` (private) — streamed LLM tokens.

## 5. ULID prefixes owned

- `bch_` — BroadcastChannel
- `bsn_` — BroadcastSubscription
- `prs_` — Presence
