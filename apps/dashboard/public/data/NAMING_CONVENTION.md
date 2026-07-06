# Mock Data — Naming Convention

> Governance rules for every JSON fixture under
> `/frontend/apps/web/public/data/`. Read this **before** adding, renaming, or
> deleting any mock file.

Companion docs:

- `_manifest.json` — every file mapped to its owning business module(s).
- `SHARED_IDS.md` — every ID prefix and every cross-cutting canonical ID.

---

## 1. Layout

**Flat.** All fixture files live directly under `/public/data/`. No folders.
Prefixes group related files alphabetically in any file listing (`athlete-*`,
`staff-*`, `payment-*`, `event-*`, `feature-*`, `sync-*`, `ai-*`, etc.).

**Why flat.**

- URL stability: the frontend fetches `/data/invoices.json` — folders would
  break every fetch path.
- Cross-cutting fixtures (users.json, audits.json, notifications.json,
  features.json) have no single owning module and don't fit a folder tree.
- File explorers already sort by prefix, so grouping is free.

**Migration cost.** If the file count grows past ~300, the prefixes make a
mechanical move to folders trivial. Don't pay that cost until you must.

---

## 2. File Names

- **Case.** `kebab-case`, ASCII only. No spaces, no CamelCase, no `_`.
- **Plural.** Fixtures are collections. Use plural nouns. Examples:
  `athletes.json`, `payments.json`, `pathway-stages.json`. Singular is only
  allowed for a **singleton** payload (e.g., `me.json`, `tenant.json`,
  `login.json`) that returns one object, not an array.
- **Prefix child collections** with the parent's noun so they cluster:
  - `athlete-guardians.json`, `athlete-enrollments.json`,
    `athlete-transfers.json`, `athlete-documents.json`
  - `staff-pay-rates.json`, `staff-bonuses.json`, `staff-transfers.json`,
    `staff-leave.json`, `staff-documents.json`
  - `payment-methods.json`, `payroll-runs.json`, `payroll-lines.json`
  - `event-invitations.json`, `event-teams.json`, `event-reminders.json`
  - `feature-overrides.json`, `feature-rollouts.json`,
    `feature-kill-switches.json`
  - `sync-cursors.json`, `sync-conflicts.json`, `sync-queue.json`
  - `ai-conversations.json`, `ai-runs.json`, `ai-tool-calls.json`,
    `ai-embeddings.json`
  - `webhook-endpoints.json`, `webhook-deliveries.json`
- **Cross-cutting fixtures** (consumed by many modules) do not carry a module
  prefix. Examples: `users.json`, `roles.json`, `permissions.json`,
  `audits.json`, `notifications.json`, `documents.json`, `features.json`.
- **Reserved prefix `_`.** Files starting with `_` are metadata
  (`_manifest.json`). Never create a fixture with a leading underscore.
- **Never use suffixes** like `-list.json`, `-array.json`, `-v2.json`. Version
  is inside the file (`version` field) if needed, not in the name. Legacy
  renames go through git history.
- **Never abbreviate** the noun. `payment-methods.json`, not `pm-methods.json`.
  `athlete-enrollments.json`, not `ae.json`.

### Adding a new file

1. Confirm no existing fixture already covers the concept.
2. Check `_manifest.json` for the owning module; if the module isn't declared,
   add it there first.
3. Choose the file name from the rules above.
4. Register the file in `_manifest.json` with
   `{ modules: [...], description: "..." }`.
5. Register the ID prefix in `SHARED_IDS.md` §2 if it's new.
6. Add records that cover every state in the entity's state machine.
7. Validate: `node -e "JSON.parse(require('fs').readFileSync('FILE','utf8'))"`.

### Deleting or renaming a file

1. Grep the frontend codebase for any hard-coded fetch to that file name.
2. Update `_manifest.json`.
3. If IDs move around, update `SHARED_IDS.md` §3.
4. Rerun the FK validator in `/tmp/validate-refs.js` before committing.

---

## 3. ID Conventions

Full prefix registry: **`SHARED_IDS.md` §2**.

- **Format:** `<prefix>_<slug-with-words>`.
- **Prefix.** Lowercase, 2–5 chars, one prefix per resource type. Introduce a
  new prefix only when no existing one fits — and register it in
  `SHARED_IDS.md`.
- **Slug.** Human-readable, describes the record. `ath_emma`, `inv_1001`,
  `sc_liam_pack_1`, `ar_liam_20260602`. Not UUIDs — these mocks are read by
  humans.
- **Dates in slugs** use `YYYYMMDD`: `log_login_owner_20260630`,
  `ar_emma_20260601`.
- **Composite scoping** (e.g., team × month): join with underscores:
  `curw_u12_autumn_w1`.
- **Reserved prefixes** (only the main integrator invents new records under
  these — see `SHARED_IDS.md` §4):
  - `aud_*` (audit entries), `notif_*` (notifications), `sub_*` (platform
    subscriptions), `plan_*` / `pgr_*` (plan grants), `ent_*` (entitlement
    licenses).
- **Synthetic IDs** used only for demonstrating a scenario (not part of real
  domain data) get the suffix `_synth`. Example: `pay_1007_synth`,
  `mat_5_synth`, `tm_ext_united`. Add a `notes` field explaining the record's
  purpose.

### Cross-module IDs

If an ID is referenced from ≥2 files, it belongs in `SHARED_IDS.md` §3
(Canonical Cross-Cutting IDs). This includes every user, athlete, staff,
invoice, payment, membership, team, season, and branch used in the demo dataset.
Sub-agents and future contributors read this section to avoid inventing
colliding IDs.

---

## 4. Record Format

- **JSON only.** Every file is either a JSON array (collections) or a JSON
  object with a `data` field (singletons like `me.json`).
- **Indentation:** 2 spaces. Keep it consistent within a file.
- **Timestamps:** ISO 8601 with `Z` suffix (e.g., `2026-06-30T09:30:00Z`). Never
  local time. Never Unix seconds.
- **Dates:** `YYYY-MM-DD` (no time component) when a date is intended.
- **Money:** integer minor units + currency string. Never floats. Never decimal
  strings.
  ```json
  { "amount_minor": 4500, "currency": "USD" }
  ```
- **`tenant_id`:** every fixture record carries `tenant_id`. In this mock set
  the value is almost always `"tnt_riverside"`. Exceptions: fixtures that are
  platform-shared/central set `tenant_id: null` (e.g., some
  `retention-policies`, `benchmarks`, `report-definitions`, `people`).
- **`id` field first** in every record. Ordering after that is:
  1. `id`
  2. Scoping columns: `tenant_id`, `organization_id`, `branch_id`, `season_id`,
     `team_id`
  3. Foreign keys (referencing other files)
  4. Domain fields
  5. `metadata` / `notes`
  6. Audit fields: `created_at`, `updated_at`, `deleted_at`
- **Nullability.** Prefer `null` over omitting a key when the field is defined
  by the entity's shape.
- **Enums.** Lowercase, snake_case in the value: `"status": "active"`,
  `"card_type": "fifa_card"`.
- **Booleans.** Explicit `true` / `false`. No 1/0.
- **Arrays.** Always JSON arrays, never comma-separated strings.

---

## 5. Foreign Keys

- **Reference by ID, not by name.** `payer_user_id: "usr_guardian_emma"`, not
  `payer_name: "Dana Johnson"`.
- **Naming pattern:** `<resource>_id` (or `<role>_user_id` when the role
  clarifies which user). Examples: `athlete_id`, `team_id`, `payer_user_id`,
  `assigned_to_user_id`, `granted_by_user_id`, `coach_id` (staff id when the
  field represents the coach in their sports view).
- **Polymorphic keys** (e.g., approval tasks, ai embeddings) use two fields:
  `<name>_type` + `<name>_id`. Example:
  ```json
  { "approvable_type": "athlete_transfer", "approvable_id": "atrf_noah_branch_pending" }
  { "source_type": "drill", "source_id": "drl_rondo_4v1" }
  ```
- **Every FK must resolve.** Run `/tmp/validate-refs.js` after edits. Zero
  orphans is the standard.

---

## 6. Lifecycle Coverage

Every entity with a state machine (per the blueprint's §9 state diagrams) must
have **at least one record per state** in its fixture. This is not decorative —
it's the contract UI code uses to prove render paths.

Examples currently covered:

- **Attendance submission:** `draft / submitted / confirmed / rejected` — see
  `attendance-submissions.json`.
- **RSVP:** `pending / confirmed / declined / cancelled` — see
  `event-invitations.json`.
- **Match:**
  `scheduled / lineup_set / in_progress / completed / postponed / cancelled / abandoned / draft`
  — see `matches.json`.
- **Membership:** `trialing / active / past_due / paused / canceled` — see
  `memberships.json`.
- **Refund:** `pending / succeeded / failed / canceled` — see `refunds.json`.
- **Chargeback:** `opened / evidence_submitted / won / lost / reversed` — see
  `chargebacks.json`.
- **Credit memo:** `open / settled / expired / void` — see `credit-memos.json`.
- **Injury:** `reported / under_treatment / recovering / cleared` — see
  `injuries.json`.
- **Season:** `upcoming / active / closed / archived` — see `seasons.json`.
- **Subscription:** `trialing / active / past_due / paused / canceled` — see
  `subscription.json`.

When adding a new fixture, check the blueprint for the entity's state machine
and ensure at least one record per state exists.

---

## 7. Cross-cutting Fixtures

Some fixtures serve many modules and cannot live under one owner:

| File                                              | Consumed by                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `users.json`                                      | User, Auth, Access, Staff, Athletes, People                                      |
| `audits.json`                                     | Data Lifecycle, and every module that emits mutations                            |
| `notifications.json`                              | Notification Delivery, and every module that emits triggers                      |
| `documents.json`                                  | Documents & Media, and every module that owns attachments                        |
| `features.json` / `feature-*.json`                | Feature Flags, referenced by any feature-flagged surface                         |
| `grants.json` / `roles.json` / `permissions.json` | Access (RBAC), referenced by every write path                                    |
| `approval-tasks.json`                             | Reception, plus refunds/transfers/matches/attendance/link-requests/registrations |

Cross-cutting fixtures **do not carry a prefix**. Every consuming module is
listed in `_manifest.json` under that file's `modules` array.

---

## 8. Validation Checklist

Before committing changes to `/public/data/`:

1. Every file parses as JSON.
   ```bash
   node -e '
   require("fs").readdirSync("frontend/apps/web/public/data")
     .filter(f => f.endsWith(".json"))
     .forEach(f => { try { JSON.parse(require("fs").readFileSync("frontend/apps/web/public/data/" + f, "utf8")); console.log(f, "OK"); } catch (e) { console.log(f, "FAIL", e.message); process.exit(1); } });'
   ```
2. All FK references resolve (`/tmp/validate-refs.js`).
3. Every new/moved/deleted file is reflected in `_manifest.json`.
4. Every new ID prefix is registered in `SHARED_IDS.md`.
5. Every cross-cutting ID that other files reference is listed in
   `SHARED_IDS.md` §3.
6. Every state in the entity's state machine has at least one record.
7. No prefix drift: file prefixes still cluster related files alphabetically.
8. No `pay_1007_synth`-style synthetic IDs leaking without a `notes` field
   explaining them.

---

## 9. Anti-patterns (rejected on review)

- **Folders for grouping.** Breaks URLs; prefixes already cluster files. Only
  revisit at 300+ files.
- **Suffix conventions.** `athletes-list.json`, `athletes-v2.json`,
  `athletes.array.json` — no.
- **Nested arrays inside singletons for lists.** Use a separate file.
  `documents.json` beats `me.data.documents[]`.
- **Money as a decimal string.** `"amount": "45.00"` — no. Use
  `amount_minor: 4500, currency: "USD"`.
- **Foreign keys as denormalized strings.** `payer_name: "Dana Johnson"` — no,
  use `payer_user_id`.
- **UUIDs as slugs.** Mocks are read by humans; use recognizable slugs.
- **Multi-tenant leakage.** Every fixture record must carry `tenant_id`, even
  when there is only one tenant in the mock set.
- **Booleans as strings.** `"is_default": "true"` — no.
- **Local timestamps.** `"created_at": "2026-06-30 09:30:00"` — no. Always ISO
  8601 with `Z`.

---

_Last updated: 2026-07-02 · Owner: this repo · Version: 1_
