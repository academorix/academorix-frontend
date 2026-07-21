---
inclusion: manual
---

# Stackra — Localization Content Strategy

Two translation problems. Do not conflate them.

## Problem 1: UI strings

**What.** Namespaced translation keys like `t('users.title')`,
`t('users.roles.admin')`, `t('items', ['count' => 5])`.

**Storage.** Laravel's default file-based catalogues under
`lang/{locale}/{namespace}.php` + `lang/{locale}.json`, augmented with a DB
`translations` table (see `localization::Translation` schema) for
workspace-specific overrides.

**Where declared.** `.php` and `.json` files under each module's `lang/` folder,
or via the workspace-admin UI.

**Resolution.** Documented in `modules/localization/readme.md` §3.1. Six-step
chain — DB workspace override → DB platform default → file-based → fallback
locale (repeat 1–3) → auto-translate → key literal.

## Problem 2: Per-row content fields

**What.** Content stored on model rows, translated per instance: a `Plan.name`,
a `NotificationTemplate.subject`, a `Newsletter.description`.

**Storage.** JSONB `translations` column on the model itself, shape
`{ locale_code: { field_name: value } }`. Added via
`localization::Blueprint::translations()` migration macro. Read + written via
the `Localization\Concerns\HasTranslations` trait (which wraps
`spatie/laravel-translatable ^6.0`).

**Where declared.** `#[Translatable]` attribute on each translated property in
the Eloquent model. The trait discovers annotated properties at boot.

**Resolution.** Documented in `modules/localization/readme.md` §3.2. Five-step
chain — active-locale value → workspace fallback → attribute-declared fallback →
app default → null.

## Governance — Tier A / B / C

Every model with translatable content is classified into a tier. The tier drives
storage strategy + auto-translate defaults + wire projection.

### Tier A — high-value, workspace-visible content

Auto-translate is **on by default**; workspaces disable per-locale. Wire
projection is active-locale scalar; admin editors opt in with
`?include=translations`.

Current Tier-A models (see `modules/localization/readme.md` §9):

| Module        | Model                  | Translated fields                        | Strategy         |
| ------------- | ---------------------- | ---------------------------------------- | ---------------- |
| subscription  | `Plan`                 | `name`, `description`                    | JSONB blob       |
| notifications | `NotificationCategory` | `display_name`, `description`            | JSONB blob       |
| notifications | `NotificationTemplate` | `subject_template`, `body_rendered_html` | Row-per-locale † |
| newsletter    | `Newsletter`           | `name`, `description`                    | JSONB blob       |
| newsletter    | `NewsletterCampaign`   | `name`                                   | JSONB blob       |
| newsletter    | `NewsletterAudience`   | `name`, `description`                    | JSONB blob       |
| newsletter    | `NewsletterIssue`      | `subject`                                | JSONB blob       |
| workspaces    | `BusinessType`         | `label`, `description`                   | Config-backed ‡  |
| workspaces    | `Branding`             | `name`                                   | JSONB blob       |

† **NotificationTemplate — row-per-locale.** Each locale is a separate row with
its own `state` (draft/published/archived) + `version`. JSONB storage would
collapse the per-locale version history.

‡ **BusinessType — config-backed.** Loaded from `config/workspaces.php`; no
Eloquent model. `translations` map lives inline in the same config entry.

### Tier B — user-authored, workspace-visible content

Same storage strategy as Tier A. Auto-translate is **off by default** —
workspaces opt in per model. **Not yet applied** — future consumers:
`sports::events::EventName`, `sports::coaching::ProgrammeDescription`,
`announcements::Announcement`.

### Tier C — administrative labels

Short internal labels (organization names, branch names) that ship in the
workspace's default locale and are not routinely re-translated. **Storage stays
as plain columns** — no `HasTranslations` composition today.

### Non-translated by design

- **Slugs, keys, codes** (`plan.slug`, `template.key`) — machine identifiers.
- **IDs, timestamps, foreign keys** — infrastructure.
- **User-generated bulk content** (registrations, transactions) — belongs to the
  active locale at creation time; historical records stay untouched.

## Storage decision matrix

Answer these questions in order to place a new translatable field:

1. **Is it a UI string with a stable key?** (e.g. `users.title`,
   `errors.not_found`) → **Problem 1**. Put it in
   `lang/{locale}/{namespace}.php` and use `t('...')`.
2. **Is the field stored per row?** (e.g. every Plan has its own `name`.) →
   **Problem 2**. Continue.
3. **Does the field need independent per-locale versioning / state?** →
   **Row-per-locale** (like `NotificationTemplate`). Add a `locale` column + a
   compound unique constraint including it. Do **not** use `HasTranslations`.
4. **Is the model an Eloquent row?** → **JSONB blob**. Add `HasTranslations`
   trait + `#[Translatable]` on each translated property +
   `$table->translations()` in the migration.
5. **Is the model a config catalogue?** → **Config-backed**. Add a
   `translations` map inline in the same config entry. Wire contract mirrors
   JSONB shape.

## Wire projection convention

Every tier-A field surfaces two shapes on the wire:

- **Default** — `data.name = "Team"` (active-locale scalar). This is what
  workspace-facing SPAs render.
- **`?include=translations`** — adds
  `data.translations = { "en": {...}, "fr-CA": {...}, "ar": {...} }`. Admin
  editors that need round-trip access to every locale request this.

Include key is configurable per attribute via
`#[Translatable(wire_include_key: '...')]` when a model has multiple
`#[AsTranslation]` containers (rare).

## Validation rules

Every translated field can carry these validation rules (declared per property
on the FormRequest / Data class):

- `translatable_required:<locale_codes>` — every listed locale must have a
  non-empty value. Accepts a comma-joined BCP-47 list or the sentinel
  `workspace_required`.
- `translatable_locale_available[:scope]` — every locale in the blob must be
  enabled on the given scope (`workspace` or `platform`).
- `translatable_length_per_locale:<max>` — per-locale character length limit.
  Multibyte-aware (`mb_strlen`).

Auto-generated from `#[Translatable]` on the model — most callers never write
these manually. See `modules/localization/rules.json` for the canonical
declarations.

## PlatformLanguage + WorkspaceLocale — why both?

`PlatformLanguage` is the platform-curated catalogue of supported locales
(BCP-47 tag + script + is_rtl + is_beta). Row count: `~40`.

`WorkspaceLocale` is the per-workspace enablement + preference layer. Each
workspace's `WorkspaceLocale` rows say which subset of `PlatformLanguage` is
enabled + which is the fallback + whether auto-translate is on per locale.

Splitting them keeps the catalogue platform-owned + gives each workspace a
per-instance policy surface without editing the shared catalogue.

## Events + listeners

- `TranslationCacheMiss` — every UI-string lookup that fell through all cache
  tiers. Listener: `MaybeDispatchAutoTranslate`.
- `TranslationWritten` — every content-field `HasTranslations::setTranslation()`
  write. Listener: `BackfillMissingLocalesViaAutoTranslate` — when a locale is
  written on one field, backfills the other enabled locales via auto-translate
  (debounced 60s per (workspace, model_type, model_id, field)).
- `MachineTranslationCompleted` — every driver call that landed. Listener:
  `ConsumeAutoTranslateEntitlement` — consumes 1 unit of
  `localization.ai_translations.month` per hour aggregated.

## What this doc does NOT do

- **Does not enumerate every `t()` key.** Those live in each module's `lang/`
  folder.
- **Does not document the fallback chain implementation.** See
  `modules/localization/readme.md` §3.1 + §3.2.
- **Does not cover currency + date-format localization.** Those read from `intl`
  extension, not our tables.
