# tenancy — module changelog

Auditor-friendly per-artefact changelog. Every entry cites the artefacts it
touches so an auditor can walk the trail without digging through git. Never
edited in place — new entries at the top, historical entries never mutate.

## 2026-07-14 — Refactor v2

- **rename** — folder renamed `modules/Tenancy/` → `modules/tenancy/`;
  `README.md` → `readme.md`; every subdirectory lowercase. Enforces the
  workspace-wide kebab-case-lowercase rule.
- **drop** — `Academorix\Tenancy\Providers\TenancyRouteServiceProvider` removed
  from `module.json.providers[]`. Routes now mount centrally from `routes.json`
  through a `ModuleRouteLoader` in `foundation` (loader itself is TBD, tracked
  in `.kiro/specs/module-blueprints/PLAN.md` §8 Q1).
- **add: entities (+7)** — `Application`, `Domain`, `DomainRecord`, `Branding`,
  `Identity`, `TenantContact`, `TenantIntegration`. Rationale in
  `.kiro/product/analyses/module-blueprints-review.md` §2.2. `TenantIdentity`
  was flagged as a one-way door by the review, so it is landed now to avoid a
  Wave-3 migration.
- **add: artefacts (+18)** — `jobs.json`, `schedule.json`, `commands.json`,
  `notifications.json`, `broadcasts.json`, `observers.json`, `listeners.json`,
  `health.json`, `metrics.json`, `analytics.json`, `caches.json`,
  `retention.json`, plus six enterprise-only artefacts from the review
  (`compliance.json`, `data-classes.json`, `errors.json`, `subprocessors.json`,
  `webhooks.json`, `feature-flags.json`), plus this `changelog.md`.
- **enrich: schemas** — every schema now carries `$version: 1`.
  `tenant.schema.json` gained `x-eloquent.baseClass`, `implements[]`,
  `appends[]`, `observers[]`.
- **enrich: traits.json** — added `owned[].schemaRef` and `consumed[].source`
  cross-links; introduced the second owned trait, `BelongsToApplication`, paired
  with the `->applicable()` migration macro for rows at the tenancy boundary.
- **split: branding** — extracted from `tenants.branding` JSONB into its own
  entity + FK. The JSONB stays as a denormalised preview column on `Tenant` so
  the workspace picker does not need to join.
- **sdui expansion** — `sdui/resources/<entity>/` folder per resource with
  `list.screen.json`, `create.screen.json`, `edit.screen.json`,
  `show.screen.json`; per-resource shared `columns.json`, `filters.json`,
  `bulk-actions.json`. Reserved a `Custom` node kind in the SDUI runtime
  contract.
- **wire contract version** — every SDUI file now declares `version: 1` in its
  `$version` field; drift is CI-gated.

## Pre-refactor baseline

- Introduced under `modules/Tenancy/` with `Tenant` + `BusinessType` only, plus
  12 artefacts (`module.json`, `README.md`, `schemas/`, `relations.json`,
  `traits.json`, `permissions.json`, `features.json`, `entitlements.json`,
  `routes.json`, `events.json`, `policies.json`, `middleware.json`,
  `hooks.json`, `data/`, `sdui/`). Superseded by the refactor above; kept in git
  history for reference.

## 2026-07-14 — Refactor v0.2 (drop stancl + complete missing files)

- **drop** — `stancl/tenancy` composer dependency removed. Was pulled in purely
  for its `Domain` model contract + tenancy identification. We now ship our own
  `TenantResolver` + `HostResolver` + `Academorix\Tenancy\Contracts\Domain`. Was
  overkill for our single-DB, row-level `tenant_id` architecture and added ~40
  unused classes.
- **drop: contracts** — `schemas/tenant.schema.json` no longer implements
  `Stancl\Tenancy\Contracts\Tenant` + `TenantWithDatabase`.
  `schemas/domain.schema.json` no longer implements
  `Stancl\Tenancy\Contracts\Domain`.
- **move: middleware** — `api.version` removed from `contributes.middleware`
  - `middleware.json`. Ownership moved to `modules/versioning/` (alias
    `versioning.resolve`). Backwards-compat: `middleware.json.delegated`
    documents the move so downstream routes get an unambiguous pointer.
- **add: trait** — `BelongsToTenantOptional` published. Sibling of
  `BelongsToTenant` for rows where `tenant_id` may legitimately be NULL
  (platform-wide catalogue rows: system audits, spam-trap suppressions, DNC
  entries, system settings scope). Adds paired blueprint macro
  `->tenantable_optional()`. Applied by `audit::Audit`,
  `notifications-mail::MailSuppression`, `notifications-sms::SmsOptOut`,
  `settings::SettingValue`.
- **add: events (+5)** — `TenantErased` (GDPR Art. 17 cascade signal, fires
  before hard-delete so listeners can produce anonymisation entries),
  `TenantUnsuspended` (distinct from Resumed \u2014 platform-admin action
  requires re-enabling integrations), `TenantSettingsUpdated` (per-tenant
  summary distinct from per-field settings::SettingsChangeEvent),
  `IdentityErased` (cross-tenant Identity anonymisation when the last
  referencing User is erased). Consumer lists inlined per event.
- **add: listeners** — `WarmHostResolver` on `foundation::ApplicationBooted`
  (replaces stancl's runtime resolution), `RewarmHostResolver` on
  `ConfigReloaded`, `MaybeEraseIdentity` + `PurgeTenantContactsForErasedUser` on
  `user::UserErased`.
- **add: middleware** — `resolve.tenant.optional` for public-tenant read
  endpoints on not-yet-verified custom domains.
- **note** — SDUI folder still stubbed. The README references the full admin
  surface but no screen files exist yet. Deferred to a dedicated SDUI-authoring
  pass; the current blueprint is complete without them.
- **note** — rename `tenancy` \u2192 `workspaces` is under active consideration
  as a follow-up atomic refactor to align with the frontend's
  `WorkspacePicker` + `useMyWorkspaces` naming. Not part of this v0.2 commit.
  See settings-conversation notes.
