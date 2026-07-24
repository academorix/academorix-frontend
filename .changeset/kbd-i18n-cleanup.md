---
"@stackra/kbd": patch
---

Close the three kbd i18n follow-ups flagged when the en/ar catalog scaffold
landed:

- **Wire the two remaining hardcoded aria-labels to `t()`.**
  `KeyboardCatalogTrigger` and `KeyboardHintsToggle` previously defaulted their
  `ariaLabel` prop to hardcoded English strings (`"Keyboard shortcuts"`,
  `"Toggle keyboard hints"`). Both now fall back to
  `t("kbd.components.keyboard_catalog_trigger.aria_label")` and
  `t("kbd.components.keyboard_hints_toggle.aria_label")` respectively when the
  caller doesn't pass a label. Screen readers now hear the locale-appropriate
  string. The prop remains an optional override.
- **Delete the legacy flat-key catalog.** `src/i18n/en/kbd.json` +
  `src/i18n/ar/kbd.json` (dotted-key catalog from an earlier migration) no
  longer resolved against the current `@stackra/i18n` dot-path runtime. Removed
  both files and the empty `src/i18n/{en,ar}` directories. Workspace-wide grep
  confirms zero live consumers.
- **Ship the new nested catalog in the published tarball.** Added
  `"src/core/i18n"` to `package.json` `files:` so `en.json` + `ar.json` land in
  the npm tarball at `package/src/core/i18n/{en,ar}.json`. The future
  `@stackra/i18n` Vite plugin / runtime walker will resolve them from the
  installed package.

The same pattern (add `src/core/i18n` to `files:`) applies to every other
frontend package that scaffolds catalogs (`routing`, `network`, `query`,
`notifications`, etc.) — a workspace-wide follow-up.
