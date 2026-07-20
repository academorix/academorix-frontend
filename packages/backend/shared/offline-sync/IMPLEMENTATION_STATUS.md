# shared/offline-sync — Phase 3 implementation status

## Status: SCAFFOLDED — sync + conflict-resolution primitives landed; every Action returns `null`

## What landed

- **`SyncEnvelope`** — the wire container for a batch of offline
  mutations. Carries client timestamp + client ULID +
  operations array.
- **`SyncOperation`** — individual mutation (create / update /
  delete) with the pre-serialised model shape + the client-side
  timestamp.
- **`SyncConflict`** — row recording a server-detected conflict
  (server-side wins by default; the FE polls this table to
  surface conflicts).
- **`SyncCheckpoint`** — client's last known server timestamp
  per subject-type, so the delta pull is bounded.
- Attribute-first migrations, factories.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`PushAction`** — POST `/sync/push`. Client sends a
  `SyncEnvelope`; server applies operations atomically in a
  transaction. Conflicts land in `sync_conflicts`.
- **`PullAction`** — GET `/sync/pull`. Client sends a checkpoint;
  server returns every row updated since. Streams via
  `chunk()` for large deltas.
- **`ResolveConflictAction`** — POST
  `/sync/conflicts/{id}/resolve`. FE tells the server which side
  wins (`server` / `client` / `merge`).
- **`ListConflictAction`** — GET `/sync/conflicts`. Pending
  conflicts for the caller.
- **`CheckpointAction`** — POST `/sync/checkpoint`. Client
  records their advance-checkpoint.

### Services to complete

- **`SyncApplier`** — the write-path that takes a `SyncEnvelope`
  and applies its operations. Detects conflicts via
  `updated_at` version compare.
- **`ConflictDetector`** — vs `SyncApplier`, this is called from
  the client-side hook to preview conflicts before push.
- **`DeltaBuilder`** — computes the delta from a checkpoint.
  Bounded per-request (default 500 rows, configurable).
- **`SyncableRegistry`** — registers models that participate in
  sync. Attribute-driven (`#[SyncableModel]`).
- **`ConflictResolver`** — enforces the policy (server-wins
  default, admin-configurable per model).

### Jobs

- **`PruneResolvedConflictsJob`** — cron: daily. Drops resolved
  conflicts older than 30 days.

### Cross-module dependencies

- **Every module with a `#[SyncableModel]` marker** — the
  registry auto-registers them.
- **`identity/user`** — `sync_conflict.actor_id` FK.
- **`platform/tenancy`** — sync operations always live under a
  tenant.

## Backlog priorities

1. **P0 — `PushAction` + `SyncApplier`** — the base write path.
   Blocks every mobile offline capability.
2. **P0 — `PullAction` + `DeltaBuilder`** — the base read
   path.
3. **P1 — `SyncableRegistry` + `#[SyncableModel]`** — model
   opt-in framework.
4. **P1 — `ResolveConflictAction`** — FE conflict-resolution
   flow.
5. **P2 — `PruneResolvedConflictsJob`** — maintenance.

**Note:** this module is a large surface. The blueprint should
be reviewed before implementation kicks off — offline-first
architecture has many cross-cutting design decisions (ULID vs
UUID timestamping, tombstone rows for deletes, causal-clock
handling) that need locking down first.
