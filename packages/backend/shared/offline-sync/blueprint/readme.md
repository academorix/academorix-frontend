# offline-sync

Mobile offline-first sync engine per blueprint §10.16. Wave 4.

## Owned entity

- `SyncCursor` (`syc_`) — per-device per-entity high-water-mark.

## The problem

Coaches take attendance in underground sports halls with no signal. The mobile
client queues local changes; when signal returns, it pushes to `/sync/push` and
pulls other users' changes via `/sync/pull`.

## Conflict resolution

Per `#[AsSyncableEntity(conflictStrategy: ...)]`:

- `last_write_wins` (scalar fields) — default.
- `merge` (attendance — union of check-ins on the same session).
- `manual` (rare, requires admin review).

## Sync payload contract

```
POST /api/v1/sync/pull { device_id, entity_types: [...], cursors: {entity_type: last_synced_at} }
     → { changes: {entity_type: [rows], deletions: [ids]}, cursors: {entity_type: new_synced_at} }

POST /api/v1/sync/push { device_id, changes: {entity_type: [rows]}, idempotency_keys: [...] }
     → { accepted, conflicts: [{row_id, resolution}] }
```

## Tenant scope

Every sync request MUST carry X-Tenant-Id (or infer from subdomain).
Cross-tenant sync refused with `403 SYNC_CROSS_TENANT_REFUSED`.

## ULID prefixes

- `syc_`
