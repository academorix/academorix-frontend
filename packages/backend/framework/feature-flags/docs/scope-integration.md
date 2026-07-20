# Scope integration

`academorix/feature-flags` does not carry its own hierarchy enum. Every place
where the package targets a subset of the world — an override row, a rollout
row, a kill-switch row, a resolver-layer lookup — expresses that target through
the shared `(scope_level, scope_value)` pair defined by `academorix/scope`. The
scope framework owns the platform's canonical hierarchy source of truth;
feature-flags is a **consumer** of that contract.

## Why depend on `academorix/scope`

Requirements 3.3, 3.4, 13.3, and 13.4 mandate that overrides, rollouts, and kill
switches target **any** level the current owner declares — `tenant`, `region`,
`academy`, `venue`, `team`, `branch`, or whatever row set exists in
`scope_definitions` for that owner.

Consequences:

- **No local `SubjectScope` enum.** Hard-coding a level catalog inside
  feature-flags would freeze the hierarchy shape at package build time and force
  a code change every time an owner adds a level. The scope framework's
  `scope_definitions` table (one row per level, one owner per row set) is
  already the platform's canonical answer to that problem.
- **One resolver contract for the whole request.** Middleware in
  `academorix/scope` runs once per request, establishes the caller's active
  `ScopeContextData`, and binds it into a request-scoped container slot. Every
  downstream consumer — feature-flags included — reads that same context, so
  cross-package decisions stay in sync.

## The `ScopePath` synthesis

The design document uses `Academorix\Scope\Contracts\ScopePath` as shorthand for
the caller's active scope chain. **That class does not ship in
`academorix/scope` today.** The `valueAt()` / `deepestLevel()` /
`sortedLevels()` accessors the resolver layers need are synthesised inside
feature-flags from the concrete scope-framework classes that DO ship:

| Symbol                                             | Kind              | Role                                                                                                                                               |
| -------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Academorix\Scope\Contracts\ScopeContextInterface` | Interface         | Request-scoped holder. `#[Bind]` + `#[Scoped]`. Exposes `get()`, `getOrFail()`, plus a `push`/`pop` override stack the emulator uses.              |
| `Academorix\Scope\Services\ScopeContext`           | Class             | Concrete implementation bound behind the interface above.                                                                                          |
| `Academorix\Scope\Data\ScopeContextData`           | Final readonly VO | The active scope snapshot. Fields: `nodeId`, `ownerId`, `scopeSlug`, `materialisedPath`, `depth`, `?node`. Provides `ancestorIds(): list<string>`. |
| `Academorix\Scope\Models\ScopeDefinition`          | Eloquent model    | One row per hierarchy level per owner in `scope_definitions`. `sort_order` is what "deepest wins" precedence sorts on.                             |
| `Academorix\Scope\Models\ScopeNode`                | Eloquent model    | One row per concrete node in `scope_nodes`. Two helpers matter: `ancestorIds()` and `isAncestorOf()`.                                              |

The local synthesis lives in `Academorix\FeatureFlags\Support\ScopePath` (see
`src/Support/ScopePath.php`). The class exposes exactly the accessors the
resolver layers need, hydrated once per evaluation via
`ScopePath::fromScopeContext($ctx)`. When `academorix/scope` eventually ships a
first-class `ScopePath` VO with the same shape, migration is a single-import
rewrite — no query or column change.

## Two distinct "scope value" concepts

The word "scope value" refers to **two different things** across these packages.
Keep the distinction:

- **feature-flags column `scope_value`** — a plain string column on
  `feature_overrides` / `feature_kill_switches` (absent on `feature_rollouts`).
  Holds the concrete entity id at `scope_level`. Example:
  `scope_level = 'venue'`, `scope_value = '01HW5Z…VENUE_UUID'`. Matches
  `ScopeNode::$entity_id`.
- **`Academorix\Scope\Models\ScopeValue`** — an Eloquent model backing the
  `scope_values` table. A namespaced key-value store used by cascading
  settings/permissions. Feature-flags does NOT read or write this table.

## What resolver layers need

Requirements 3.3, 3.4, 13.3, and 13.4 boil down to three questions each resolver
layer asks against the caller's active scope:

1. **Is `scope_level = L` present in my active scope path?** Layers that answer
   "no" defer via `return null` rather than emitting a decision.
2. **What is the `scope_value` at level `L`?** That id is the string the rollout
   hasher feeds into `RolloutHasher::bucket()` and the override / kill-switch
   queries match on their `scope_value` column.
3. **When multiple rows across different levels match, which one wins?**
   "Deepest wins" — the row whose `scope_level` has the greatest `sort_order` on
   `scope_definitions` for the current owner.

`ScopePath::fromScopeContext()` answers all three in two queries:

```php
$active = $context->get(); // ScopeContextData | null

// Load ancestor node chain (root → self) in one query.
$ancestorIds   = $active->ancestorIds();
$ancestorNodes = ScopeNode::query()->whereIn('id', $ancestorIds)->get();

// Load sort-order table for the active owner in one query.
$sortOrders = ScopeDefinition::query()
    ->where('owner_id', $active->ownerId)
    ->pluck('sort_order', 'slug')
    ->all();

// Compose the level → value map.
$levelToValue = [];
foreach ($ancestorNodes as $node) {
    $levelToValue[$node->scope_slug] = $node->entity_id;
}

// Return the frozen VO.
return new ScopePath($levelToValue, $sortOrders);
```

Downstream resolver layers make ZERO additional scope-framework queries — the
snapshot is threaded through `ResolutionContext` and every layer reads from the
same instance.

## Per-table targeting

### `feature_overrides` (Req 9.2)

- `scope_level` — matches `ScopeDefinition.slug` for the active owner.
- `scope_value` — matches `ScopeNode.entity_id` for a node whose
  `scope_slug = scope_level`.
- Unique index: `(tenant_id, flag, scope_level, scope_value)` — one override row
  per flag per specific entity.
- Query: layer selects rows whose `scope_level` is present in the caller's
  active scope path AND `scope_value` equals the caller's entity id at that
  level AND `(expires_at IS NULL OR expires_at > now())`. Deepest `sort_order`
  wins.

### `feature_rollouts` (Req 9.3)

- `scope_level` — matches `ScopeDefinition.slug`. There is **no** `scope_value`
  column: a rollout describes "hash every ScopeValue at this level into 100
  buckets and enable `percentage`% of them". The hasher's input is the caller's
  `entity_id` at `scope_level`, drawn at evaluation time.
- Unique index: `(tenant_id, flag, scope_level)` — one rollout row per flag per
  level.
- Query: layer selects the row whose `scope_level` is present in the caller's
  active scope path AND `(starts_at, ends_at)` includes `now()`. If the row's
  `scope_level` is not in the caller's path (e.g. a `team`-level rollout in a
  console command with no team scope), the layer returns `null` and evaluation
  falls through to `PlanGateLayer` (Req 13.4).

### `feature_kill_switches` (Req 9.4, 9.7)

- `scope_level` — matches `ScopeDefinition.slug`.
- `scope_value` — **nullable**. `NULL` means "every entity at this level".
- No `tenant_id` column — kill switches are platform-scoped; tenant targeting is
  expressed via `(scope_level = 'tenant', scope_value = <tenant_id>)`.
- Unique index: `(flag, scope_level, scope_value)`.
- Query: layer selects rows where `scope_level` is present in the caller's
  active scope path AND
  `(scope_value IS NULL OR scope_value = <caller entity id at that level>)` AND
  `enabled_at <= now()` AND `(disabled_at IS NULL OR disabled_at > now())`.
  Deepest `sort_order` wins.

## Extending the hierarchy

Because all three tables target scope through `scope_level`, adding a new
hierarchy level to `scope_definitions` extends **every** flag mechanism
automatically:

- Overrides at the new level: insert a `feature_overrides` row with
  `scope_level = <new slug>`.
- Rollouts at the new level: insert a `feature_rollouts` row with
  `scope_level = <new slug>`.
- Kill switches at the new level: insert a `feature_kill_switches` row with
  `scope_level = <new slug>` (and optionally a specific `scope_value` — omit for
  level-wide shut-off).

Precedence continues to sort on `sort_order`, so a deeper level correctly beats
a shallower one on the day it's added — no feature-flags code change required.

## Example — a typical web request

Consider a tenant whose `scope_definitions` rows are (in `sort_order`
ascending):

```
sort_order  slug        parent_slug
0           global      null
1           tenant      global
2           academy     tenant
3           team        academy
```

A request comes in for a coach viewing team `T-42` inside academy `A-7`. The
scope middleware resolves the active node to team `T-42`, so
`ScopeContextInterface::getOrFail()` returns a `ScopeContextData` with
`scopeSlug = 'team'`, `depth = 3`, `materialisedPath = '/ROOT/T7/A7/T42/'`.

Feature-flags derives the caller's `(scope_level, scope_value)` chain as:

```
scope_level  scope_value              sort_order
global       <root entity id>         0
tenant       <tenant T-7 entity id>   1
academy      <academy A-7 entity id>  2
team         <team T-42 entity id>    3
```

Evaluating `Feature::active('coach.beta_toolbelt')`:

- **`KillSwitchLayer`** looks for kill-switch rows whose `scope_level` is one of
  `{global, tenant, academy, team}`. Suppose an operator set a kill switch at
  `scope_level = 'academy'`, `scope_value = <academy A-7 entity id>` — it
  matches. `sort_order = 2` is the deepest match, so the layer returns
  `FeatureResolution::killSwitch()` and evaluation stops.
- If there were no kill switch, **`OverrideLayer`** would look for override rows
  with matching `(scope_level, scope_value)` pairs. A `scope_level = 'team'` row
  for `scope_value = <T-42 id>` (deepest match, `sort_order = 3`) would win over
  a `scope_level = 'tenant'` row.
- If there were no override, **`RolloutLayer`** would consult the single
  `feature_rollouts` row for this flag. If that row targets
  `scope_level = 'team'`, the hasher receives `(flag, <T-42 entity id>)` and
  returns `true` or `false` deterministically.
- Finally, **`PlanGateLayer`** and **`DefaultLayer`** run as normal, using the
  tenant resolved from the same `ScopeContextData->ownerId`.

The scope framework does the routing once, at request bootstrap; feature-flags
reads the resulting `ScopeContextData` the same way `academorix/settings` and
`academorix/permissions` do.
