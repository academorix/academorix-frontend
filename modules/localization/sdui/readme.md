# localization — SDUI blueprints

## Surfaces

### `resources/language/`

Platform-admin catalogue CRUD.

- `list.screen.json` — filterable by direction / script / is_active_on_platform / is_beta.
- `create.screen.json` / `edit.screen.json` — ~10 fields including BCP 47 tag validation.
- `show.screen.json` — read-only view + active WorkspaceLocale count.

### `resources/workspace-locale/`

Workspace-facing enabled-locales manager.

- `list.screen.json` — table of enabled locales with default / fallback / auto-translate flags.
- `create.screen.json` — pick a Language to enable + set defaults + auto-translate config.
- `edit.screen.json` — same fields, minus language_id.

### `resources/translation/`

Workspace-facing per-locale translation manager.

- `list.screen.json` — grouped by namespace + group. Filter by locale + source + is_stale + verified.
- `edit.screen.json` — inline editor for one translation. Preview panel showing platform default + fallback resolution.

### `resources/translation-job/`

- `list.screen.json` — bulk job history + in-progress status.
- `create.screen.json` — pick source_locale + target_locale_codes[] + namespaces[] + driver.
- `show.screen.json` — progress + per-locale breakdown + failure log.

### `widgets/`

- `language-switcher.widget.json` — navbar dropdown. Shows enabled WorkspaceLocale rows; user pick updates preferred_locale + reloads with new active locale.
- `translation-status-chip.widget.json` — colour-coded chip for translation source + verified state.
- `locale-flag.widget.json` — flag emoji + native name for one WorkspaceLocale row.
