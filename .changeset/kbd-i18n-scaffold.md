---
"@stackra/kbd": patch
---

Scaffold i18n catalogs for `@stackra/kbd` — the last UI-heavy package missing an
`en.json` / `ar.json` under `src/core/i18n/`. Extracted 45 unique translation
keys from the existing `t("kbd.…")` call sites across command palette layouts,
keyboard catalog, shortcut recorder, command trigger, and command types.

Non-breaking additive change:

- `packages/frontend/kbd/src/core/i18n/en.json` — English source of truth,
  mirrors the routing/network/query catalog shape (nested JSON, not flat dotted
  keys — required by `@stackra/i18n`'s dot-path runtime resolver).
- `packages/frontend/kbd/src/core/i18n/ar.json` — Machine-generated Modern
  Standard Arabic. **Native Arabic reviewer pass required before shipping**,
  especially the 11 `command_types.*` entries where a product-voice choice was
  made (e.g. "Records" vs "Entities" for `entity_label`).

Follow-up items (not in this changeset — separate PRs):

- Two hardcoded aria-label defaults in
  `keyboard-catalog-trigger.component.tsx` +
  `keyboard-hints-toggle.component.tsx` need to be wired to `t()`.
- Legacy flat-key catalog at `src/i18n/{en,ar}/kbd.json` no longer resolves
  against the current `@stackra/i18n` runtime and should be deleted once an app
  consumer verifies the new nested layout.
- Vite plugin or `forFeature` runtime needs the JSON reachable from the npm
  tarball — either copy to `dist/` at build time or add `src/core/i18n/*.json`
  to `files:` in `package.json`.
