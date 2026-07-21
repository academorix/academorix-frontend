# Release `vX.Y.Z`

> Copy this into the GitHub PR description for the release PR. Owning agent:
> `release-manager`.

## TL;DR

TODO(release-manager): one paragraph. What's in this release, at a level a
CTO reviewing the release page can understand in 30 seconds.

## New features

TODO(release-manager): list every feature that ships in this release, one
bullet each, with a link to the PR or spec.

- **`<feature-slug>`** — one-line description.
  ([PR #NNN](https://github.com/stackra/stackra-frontend/pull/NNN))
- **`<feature-slug>`** — one-line description.
  ([Spec](.kiro/specs/<slug>/design.md))

## Breaking changes

TODO(release-manager): every breaking change. **If there are none, DELETE this
section** — an empty "Breaking changes" heading is worse than none.

### `@stackra/<package>` — `<breaking-name>`

- **What broke:** `<one sentence>`
- **Why:** `<one sentence>` (link ADR)
- **Migration steps:**
  1. `<step>`
  2. `<step>`

## Migration steps (breaking release only)

TODO(release-manager): the consolidated migration script consumers run. Only
present when there are breaking changes above.

```sh
# Bump every workspace consumer at once
pnpm --filter '@stackra/*' update @stackra/<package>@^X.Y.Z

# Run the shipped codemod
pnpm dlx @stackra/codemod-<slug>
```

## Fixes

TODO(release-manager): every bug fix. Group by severity if there are many.

- **`<fix-slug>`** — one-line description. ([PR #NNN](...))
- **`<fix-slug>`** — one-line description. ([PR #NNN](...))

## Performance

TODO(release-manager): any measured perf changes. Cite the benchmark.

- Bundle size: `<before>` → `<after>` (`<delta>`). [size-limit report](...)
- Cold start: `<before>` → `<after>` (`<delta>`).

## Verify checklist

TODO(release-manager): the exact checks the reviewer runs before merging.

- [ ] `pnpm build` — 100% green.
- [ ] `pnpm typecheck` — 100% green.
- [ ] `pnpm lint` — 100% green.
- [ ] `pnpm test` — 100% green.
- [ ] `pnpm size` — no budget regression.
- [ ] Canary deployed to staging environment.
- [ ] Canary metrics observed for `<N>` hours — no error-rate change.
- [ ] Release notes reviewed by `docs-lead`.
- [ ] Breaking-change migration guide reviewed by consumer maintainer.

## Known issues

TODO(release-manager): anything shipping known-broken. Include a workaround
and the tracking issue.

- **`<issue-slug>`** — `<one-sentence>`. Workaround: `<workaround>`.
  ([Tracking issue](...))

## Rollback plan

TODO(release-manager): exact steps to roll back if the canary goes red.

1. Revert the release tag on the deploy environment.
2. Trigger the previous release's artefact via `pnpm --filter <app> deploy --tag=<prev>`.
3. Notify `#releases` Slack channel.
4. File post-incident retro if user-visible impact was recorded.

## Sign-offs

- [ ] `release-manager` — release orchestration OK
- [ ] `docs-lead` — release notes accurate + complete
- [ ] `security-lead` — no security regressions (breaking releases only)
- [ ] `sre-lead` — deployment plan reviewed (breaking releases only)
