<!-- This template is loaded by GitHub for every new PR. Fill in each section — reviewers will bounce PRs missing summary / testing. -->

<!--
@file        .github/pull_request_template.md
@description Default pull-request template. GitHub prefills this when a
             contributor opens a PR against the repository. Sections are
             ordered so a reviewer skimming top-to-bottom can decide
             whether the PR is even reviewable (summary + type) before
             sinking time into a diff read.
-->

## Summary

<!-- What changed and why, in 1-3 sentences. Product-level intent, not
     a file list. Reviewers use this to decide whether the PR matches
     the linked issue's scope. -->

## Change type

<!-- Tick every checkbox that applies. `breaking` triggers extra review. -->

- [ ] feat — new user-facing capability
- [ ] fix — bug fix (no behaviour change beyond the bug)
- [ ] refactor — internal restructuring, no behaviour change
- [ ] docs — documentation only
- [ ] test — test-only changes
- [ ] chore — tooling, deps, workspace hygiene
- [ ] breaking — public API / route / DB shape change (requires migration note
      below)

## Screenshots / recordings

<!-- Required for any UI change. Include a before/after pair. Attach an
     RTL screenshot if the change touches layout / spacing / icons. -->

## Testing

- [ ] Unit tests updated / added
- [ ] E2E tests updated / added (Playwright)
- [ ] Manual smoke test on the affected flow (describe below)

<!-- Describe the manual smoke: what you clicked, what you saw, on which
     locale + theme. If the change is server-only, say so. -->

## Deployment considerations

<!-- Tick every item this PR requires operators to do at deploy time. -->

- [ ] New environment variable(s) — list them in the PR body + Doppler
- [ ] Database migration required — link the migration PR / spec
- [ ] Feature flag required — name the flag + default value
- [ ] None — safe to merge + deploy without ops action

## Related issues

<!-- Use GitHub's auto-close syntax: `Closes #123`. Link every issue this
     PR resolves so the tracker updates on merge. -->

Closes #
