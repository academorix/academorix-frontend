---
inclusion: manual
---

# Stackra — Module Boot-Order Priority Convention

**Lower priority = boots earlier.** `priority=0` is the first module to boot;
`priority=100` is deep-domain surface loaded last. Every module declares its
priority in `module.json.priority` (integer).

## Why "lower boots first" (and not the other way around)

Reads naturally as "priority position in queue". Priority-0 is at the front of
the queue. Priority-30 is 30 slots back. Every OS scheduler + task priority
convention we drew from uses the same direction — lower number = higher
precedence.

We considered "higher boots first" once. Rejected because:

- SemVer + display sort order uses ascending "smaller boots first"; flipping
  would put priority=99 first in every log stream + module inspector output.
- `sort()` in every language returns ascending by default. Boot order =
  `sort by priority ASC` reads correctly.

## Priority ranges (wave map)

The convention groups priorities by wave. Numbers within a wave are
non-consecutive so future modules can slot in without renumbering:

| Range     | Wave                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **0**     | `foundation` (Wave 0)                                                                                                                |
| **1–9**   | reserved (future substrate that must boot before workspaces)                                                                         |
| **10–12** | Wave 1 — `workspaces` (10), `versioning` (12), `telemetry` (12)                                                                      |
| **13–19** | reserved (gap for future Wave-1 substrate)                                                                                           |
| **20–29** | Wave 2–3 — audit / activity (20), settings (22), entitlements (22), webhook (22), transfer (23), invitations (25), subscription (29) |
| **30–34** | Wave 5 — search / geography / geofencing / localization (30)                                                                         |
| **35+**   | Wave 6 — domain-shaped surfaces (newsletter, future sports/teams/branches)                                                           |

Priorities are not sacred — a new module may claim any unused integer in the
correct wave range. Tie-breakers (two modules with the same priority) are
allowed only between UNRELATED modules; the validator refuses ties inside a
dependency chain.

## The invariant

For every dependency edge A → B (A depends on B), **B.priority < A.priority**
strictly. B must finish booting before A. The validator refuses ≥.

```
foundation (0)   ← workspaces (10)   ← activity (20)   ← entitlements (22)
                                     ← settings (22)   ← subscription (29)
```

Every arrow strictly increases priority left → right.

## CI check

`modules/shared/foundation/scripts/validate-module-graph.py` walks every
`module.json.dependencies` edge + refuses:

- Any dep with a priority ≥ the consumer's priority.
- Any missing `priority` field.
- Any dep that doesn't exist on disk (phantom).

Run locally:

```
python3 modules/shared/foundation/scripts/validate-module-graph.py
```

Exit code non-zero = merge blocked in CI.

## Recent adjustments

Fixed in the July 14 2026 hygiene pass:

- `entitlements`: 15 → **22**. Was booting before `activity` (20) + `audit` (21)
  even though it emits activity + audit events at boot.
- `subscription`: 18 → **29**. Was booting before `notifications-mail` (26) even
  though welcome-email dispatch depends on that transport.
- `transfer`: 22 → **23**. Was tying with `settings` inside a dependency chain.

## Anti-patterns

- **Renumbering to break a chain.** If A depends on B and A currently boots
  first, don't just swap priorities. Fix the dependency: either B needs its dep
  moved earlier, or A should not depend on B at all.
- **Priority=0 outside foundation.** Reserved for the platform substrate.
- **Priorities > 50 without justification.** Everything domain-shaped fits in
  Wave 6 (35–50). Numbers above 50 signal an accidental deep chain.
- **Tightening priority to enforce "features on top".** The convention is
  boot-order, not feature-hierarchy. Domain modules have HIGH priority because
  they boot LAST, not because they're most important.

## When adding a new module

1. Identify the wave the module belongs to (see the wave map +
   `module-graph.md`).
2. Pick an unused integer in the range with room on either side.
3. List every module you depend on in `module.json.dependencies`.
4. Ensure every listed dep has a strictly lower priority.
5. Run the validator. If it fails, either adjust priorities or reconsider the
   dependency choice.

## When changing an existing priority

1. Confirm nobody's `dependencies` array becomes non-monotonic.
2. Run the validator locally before pushing.
3. Update `module-graph.dot` if the wave placement changes.
4. Note the rationale in the module's `changelog.md`.

## What this doc does NOT do

- **Does not decide dependency directions.** That's a per-module design choice
  documented in each module's readme.
- **Does not enumerate every module + priority.** See `module-graph.md` +
  `module-graph.dot` for the current graph.
