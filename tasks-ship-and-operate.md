---
title: Tasks — Ship & Operate (Phase 6-7)
status: active
phase_start: 6
phase_end: 7
duration_target: Day 26 → Day 90+
owning_leads:
  - release-manager       (Phase 6)
  - sre-lead              (Phase 7)
---

# Tasks — Ship & Operate (Phase 6-7)

Tracker for the back half of the pipeline. Every feature that clears Phase 5
(all reviewer gates green) enters Phase 6 here to become a release; every
service the workspace ships enters Phase 7 to be operated.

## Purpose

- **Phase 6 (Ship):** package + release. Cut a version, deploy the canary,
  observe, promote. Owned by `release-manager`, executed by `deploy-engineer`.
- **Phase 7 (Operate):** run. On-call rotations, SLOs, runbooks, alerts,
  incidents. Owned by `sre-lead`, executed by `observability-engineer` +
  `incident-commander`.

These two phases share this file because they're operationally coupled —
every Phase 6 release event immediately becomes a Phase 7 observability
event (canary metrics, alert routing, SLO burn).

## Structure

- **Phase 6 — Release template** (per release)
- **Phase 7 — Operational template** (per service)
- **Incident log** (per real incident)
- **SLI/SLO status board** (workspace-wide)

## Usage guide

### Phase 6 flow

1. When Phase 5 reports green for feature `<slug>` on the frontend +
   backend orchestration trackers, and a version bump is queued, add a
   **Phase 6 — Release** block using the template.
2. Invoke `release-manager` (see invocation block below).
3. `release-manager` walks the checklist, delegates the deploy steps to
   `deploy-engineer`, then reports done.
4. Log the release cut in the **Log**.
5. Immediately open a Phase 7 block for any service the release affected
   (if one doesn't already exist).

### Phase 7 flow

1. Every service the workspace runs gets one Phase 7 block. Add it the day
   the service is first deployed.
2. `sre-lead` invokes `observability-engineer` to wire alerts + dashboards +
   runbook per the checklist.
3. As real incidents happen, add rows to the **Incident log** with the
   `incident-commander`'s post-mortem link.
4. Refresh the **SLI/SLO status board** weekly (agent-owned, humans read).

## Phase 6 — Release template

Copy verbatim into **Current releases in flight**.

```markdown
### `vX.Y.Z` — <one-line human title of what shipped>

- **Release owner:** `release-manager` (delegates to `deploy-engineer` for
  canary + promote)
- **Included features:** `<feature-slug>`, `<feature-slug>`, ...
- **Kind:** feature / breaking / patch / security
- **Status:** prepping / canary / promoted / rolled-back / archived

**Prerequisites (Phase 5 green)**

- [ ] Every reviewer artefact green for every included feature
- [ ] `quality-lead` sign-off on the Phase 5 gate
- [ ] Changesets consolidated (via `docs-changesets-steward`)

**Release preparation**

- [ ] Version bumps applied (per package Changesets)
- [ ] Release notes drafted (via `.kiro/skeletons/release-pr.md` shape)
- [ ] Migration guide written if breaking
- [ ] Tag cut on `main` (`vX.Y.Z`)
- [ ] Release PR opened; description follows the PR skeleton
- [ ] Release PR sign-offs (release-manager, docs-lead)

**Canary**

- [ ] `deploy-engineer` canary plan prepared
- [ ] Canary deployed to staging environment
- [ ] Canary metrics observed for `<N>` hours
- [ ] `sre-lead` sign-off on canary metrics (error rate flat, latency stable)

**Promote**

- [ ] Promote to full deploy
- [ ] Deployment verification complete
- [ ] Rollback plan documented (per `.kiro/skeletons/release-pr.md`)
- [ ] Post-release audit (owned by `docs-lead`): CHANGELOG updated, release
      notes published, comms sent

**Handoff to Phase 7**

- [ ] Every service touched by this release has a Phase 7 block
- [ ] Alert coverage refreshed for new endpoints
- [ ] Dashboard panels added / updated for new metrics
```

## Phase 6 — Current releases in flight

*(none yet)*

## Phase 7 — Operational template

Copy verbatim into **Services in operation** for every deployed service.

```markdown
### `<service-name>` — <one-line role>

- **Service:** `<service-name>` (matches `catalog.json` `name` where relevant)
- **On-call rotation:** `<rotation-name>` in PagerDuty
- **Owning agent:** `sre-lead` (delegates to `observability-engineer` +
  `incident-commander`)
- **Deployed since:** `YYYY-MM-DD`
- **Related runbook:** `docs/runbooks/<service-name>.md`
- **Related SLO doc:** `docs/slos/<service-name>.md`

**SLI / SLO**

- [ ] SLI defined
- [ ] SLO agreed with product-lead + service owner
- [ ] SLO burn-rate alert wired

**Alerting**

- [ ] Alert enabled for the SLI
- [ ] PagerDuty routing wired to the correct rotation
- [ ] Escalation path documented in the runbook
- [ ] Runbook committed at `docs/runbooks/<service-name>.md`
      (per `.kiro/skeletons/runbook.md` shape)

**Observability**

- [ ] Sentry alert rules wired (per `.kiro/skeletons/sentry-project.yaml`)
- [ ] Grafana dashboard published (per `.kiro/skeletons/grafana-dashboard.json`)
- [ ] Log-routing configuration deployed (structured JSON, tenant-tagged)
- [ ] Tracing enabled + service map validates

**DR + rollback**

- [ ] Rollback procedure documented in the runbook
- [ ] DR drill scheduled quarterly
```

## Services in operation

*(none yet)*

## Incident log

One row per real incident. Fill in the row on-the-fly; the post-mortem link
lands when `incident-commander` files it.

| Date (UTC)          | Service           | Severity | Duration | Summary                                                | Post-mortem                  |
| ------------------- | ----------------- | -------- | -------- | ------------------------------------------------------ | ---------------------------- |
| *(no rows yet)*     |                   |          |          |                                                        |                              |

## SLI/SLO status board

Refresh weekly. Reflects the current 28-day rolling window per service.

| Service           | SLI                     | SLO target | Current | Burn rate | Status |
| ----------------- | ----------------------- | ---------- | ------- | --------- | ------ |
| *(no rows yet)*   |                         |            |         |           |        |

## Invocation blocks

### Phase 6 orchestrator

```
invoke_sub_agent(
  name: 'release-manager',
  prompt: 'Feature slug list <slugs> cleared Phase 5. Cut release vX.Y.Z:
           consolidate changesets, bump versions, draft release notes per
           `.kiro/skeletons/release-pr.md`, cut the tag, hand off to
           deploy-engineer for canary + promote.',
  contextFiles: [
    { path: 'tasks-frontend-orchestration.md' },
    { path: 'tasks-backend-orchestration.md' },
    { path: '.kiro/skeletons/release-pr.md' },
    { path: 'tasks-ship-and-operate.md' }
  ],
)
```

### Phase 6 canary + promote

```
invoke_sub_agent(
  name: 'deploy-engineer',
  prompt: 'Deploy release vX.Y.Z to the canary environment. Observe error
           rate + latency + saturation for <N> hours. Promote to full deploy
           on green, roll back on red. Document rollback in the release PR.',
  contextFiles: [
    { path: 'tasks-ship-and-operate.md' },
    { path: 'docs/runbooks/<service>.md' }
  ],
)
```

### Phase 7 orchestrator (per service)

```
invoke_sub_agent(
  name: 'sre-lead',
  prompt: 'Service <service-name> is live. Walk the Phase 7 checklist for
           it: define SLI, agree SLO, wire alerts, publish runbook,
           configure observability, schedule DR drill.',
  contextFiles: [
    { path: 'tasks-ship-and-operate.md' },
    { path: '.kiro/skeletons/runbook.md' },
    { path: '.kiro/skeletons/sentry-project.yaml' },
    { path: '.kiro/skeletons/grafana-dashboard.json' }
  ],
)
```

### Phase 7 observability wiring

```
invoke_sub_agent(
  name: 'observability-engineer',
  prompt: 'For service <service-name>: promote the skeletons at
           `.kiro/skeletons/{sentry-project.yaml,grafana-dashboard.json}`
           into the app-level observability config. Set the real DSN,
           dashboard UID, alert thresholds. Verify the panels render.',
  contextFiles: [
    { path: '.kiro/skeletons/sentry-project.yaml' },
    { path: '.kiro/skeletons/grafana-dashboard.json' }
  ],
)
```

### Phase 7 incident response

```
invoke_sub_agent(
  name: 'incident-commander',
  prompt: 'An incident just triggered on <service-name>. Follow the runbook
           at `docs/runbooks/<service-name>.md`. Log every action in an
           incident-timeline file at
           `docs/incidents/YYYY-MM-DD-<slug>.md`. File the post-mortem
           within 48 hours.',
  contextFiles: [
    { path: 'docs/runbooks/<service-name>.md' },
    { path: 'tasks-ship-and-operate.md' }
  ],
)
```

## Log

Dated entries. Format: `YYYY-MM-DDTHH:MM:SSZ — <release-or-service> — <event> — <agent>`.

*(no entries yet)*

## Cross-references

- **Prerequisite tracker:** `tasks-frontend-orchestration.md`,
  `tasks-backend-orchestration.md` (Phase 4-5)
- **Roster:** `AGENT_ROSTER.md` §Phase 6-7
- **Quickstart recipes:** `AGENT_QUICKSTART.md` §Recipe 5
- **Skeletons:**
  `.kiro/skeletons/release-pr.md`,
  `.kiro/skeletons/runbook.md`,
  `.kiro/skeletons/sentry-project.yaml`,
  `.kiro/skeletons/grafana-dashboard.json`,
  `.kiro/skeletons/k6-scenario.js`
