---
"@stackra/actions": patch
"@stackra/ai": patch
"@stackra/analytics": patch
"@stackra/cache": patch
"@stackra/collaboration": patch
"@stackra/config": patch
"@stackra/consent": patch
"@stackra/console": patch
"@stackra/container": patch
"@stackra/contracts": patch
"@stackra/coordinator": patch
"@stackra/csp": patch
"@stackra/dashboard": patch
"@stackra/decorators": patch
"@stackra/devtools": patch
"@stackra/error": patch
"@stackra/events": patch
"@stackra/http": patch
"@stackra/i18n": patch
"@stackra/kbd": patch
"@stackra/logger": patch
"@stackra/monitoring": patch
"@stackra/network": patch
"@stackra/notifications": patch
"@stackra/pipeline": patch
"@stackra/pwa": patch
"@stackra/query": patch
"@stackra/queue": patch
"@stackra/realtime": patch
"@stackra/routing": patch
"@stackra/scheduler": patch
"@stackra/scope": patch
"@stackra/sdui": patch
"@stackra/settings": patch
"@stackra/state": patch
"@stackra/storage": patch
"@stackra/support": patch
"@stackra/sync": patch
"@stackra/testing": patch
"@stackra/theming": patch
"@stackra/ui": patch
"@stackra/vite": patch
---

Workspace-wide standards conformance sweep. No behavioural changes; no public
API changes. Every `@stackra/*` frontend package converges on the shared
per-file discipline defined under `.kiro/steering/`.

- **Package manifests normalised.** Removed the redundant leaf-level
  `packageManager` field on 37 packages; moved `react` / `react-dom` /
  `reflect-metadata` peers to the workspace catalog so version drift is
  impossible.
- **React entity files nested per folder.** Every hook, context, component and
  provider that previously sat at the top of `react/hooks/`, `react/contexts/`,
  `react/components/`, or `react/providers/` now lives in its own named folder
  (`react/hooks/use-x/use-x.hook.ts`, etc.) with a barrel `index.ts` — matching
  `.kiro/steering/code-standards.md`. 214 files moved; imports through the
  public subpath entries are unchanged.
- **Native helpers routed through `@stackra/support`.** 55+ call sites migrated
  from native `.toLowerCase()` / hand-rolled `sleep` / `process.env` reads / ad
  hoc URL string building to the canonical `Str`, `sleep`, `Env`, `Uri`, `once`,
  and `retry` helpers per `.kiro/steering/support-utilities.md`.
- **Inline documentation added.** 291 source files gained top-of-file `@file` /
  `@module` / `@description` docblocks. 107 barrel indexes received full
  canonical blocks, 178 files with partial docblocks were augmented with the
  missing `@file` tag, and 6 fully undocumented interface files received full
  JSDoc coverage per `.kiro/steering/documentation.md`.
- **Typecheck GREEN** across all 42 packages after every round.
