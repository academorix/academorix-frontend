# .kiro/skeletons — human-authored templates

Substrate templates that get **hand-copied** into their target location when a
human agent (or a person) needs to author a new artifact of the same shape.

## Relationship to `tools/cli/src/Stubs/stubs/**`

Two template systems live in this repo — they solve different problems.

| Kind                                  | Home                          | Consumer         | Author time                       |
| ------------------------------------- | ----------------------------- | ---------------- | --------------------------------- |
| **Machine templates** (with `{{ token }}` markers) | `tools/cli/src/Stubs/stubs/`   | `academorix` CLI | Rendered by `make:*` commands     |
| **Human templates** (with prose scaffolding + TODOs) | `.kiro/skeletons/` (this dir)  | Humans + agents  | Copied + edited when needed       |

The skeletons here have prose scaffolding + `TODO` comments a human reads and
fills in. The stubs there have token markers a CLI substitutes.

Every skeleton has a matching stub in `tools/cli/src/Stubs/stubs/` — same shape,
different consumer.

## Skeleton catalogue

| File                        | Copy to                                       | Owning agent               |
| --------------------------- | --------------------------------------------- | -------------------------- |
| `lighthouserc.js`           | `<app-root>/lighthouserc.js`                  | `performance-engineer`     |
| `size-limit.json`           | Root `.size-limit.json`                       | `performance-engineer`     |
| `a11y-audit.yml`            | `.github/workflows/a11y-audit.yml`            | `accessibility-audit-lead` |
| `k6-scenario.js`            | `<app-root>/perf/k6/<scenario>.js`            | `performance-engineer`     |
| `sentry-project.yaml`       | `<app-root>/observability/sentry.yaml`        | `observability-engineer`   |
| `grafana-dashboard.json`    | `<app-root>/observability/dashboards/<name>.json` | `observability-engineer`   |
| `runbook.md`                | `docs/runbooks/<service>.md`                  | `sre-lead`                 |
| `adr.md`                    | `docs/adr/00XX-<slug>.md`                     | `docs-adr-steward`         |
| `release-pr.md`             | GitHub PR description on release PRs          | `release-manager`          |

## Promoting a skeleton

1. `cp .kiro/skeletons/<name> <target-path>`
2. Fill in the `TODO` markers with real values for your context.
3. Delete every `TODO` comment before committing — the file is real content now.
4. If the skeleton needed something the current shape doesn't cover, propose a
   change to the skeleton in a follow-up PR (don't fork).

## Modifying a skeleton

Skeletons stay minimal. When adding a new placeholder:

- Prefer a `TODO(<owner>): <what to fill>` comment on its own line.
- Do NOT introduce `{{ token }}` markers — those belong in the CLI stubs.
- Keep the file runnable / valid syntax where possible so a promoter can drop it
  in and iterate without a syntax error on Day 1.

## Not tracked here

- Framework-generated code stubs (see `tools/cli/src/Stubs/stubs/`).
- Docs the CLI generates as part of `make:*` — the CLI writes canonical shapes;
  humans expand them.
