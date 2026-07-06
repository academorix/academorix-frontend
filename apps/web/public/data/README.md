# /public/data — Mock Data Contract

This folder is the **API contract** for Academorix. Every JSON file here mirrors
what a REST endpoint would return; the shape is intentionally close to what the
backend will emit. The frontend fetches these files directly during development,
and both frontend and backend teams treat this set as the source of truth for
entity shapes.

## Numbers today

| Metric                          | Value                                  |
| ------------------------------- | -------------------------------------- |
| JSON files                      | 152                                    |
| Records in arrays               | 1,124                                  |
| Blueprint modules covered       | 53 with fixtures + 4 by-design without |
| Simple FK relationships checked | 156                                    |
| Polymorphic FK groups checked   | 8                                      |
| State machines checked          | 29                                     |

## Governance files

Read these in order before adding, moving, or deleting anything:

- **`README.md`** — this file. Start here.
- **`_manifest.json`** — every file mapped to its owning blueprint module(s)
  with a short description. Written by hand; kept in sync by the validator.
- **`SHARED_IDS.md`** — every ID prefix (`usr_`, `ath_`, `inv_`, …) and every
  canonical cross-cutting ID. Prevents two people from inventing colliding IDs.
- **`NAMING_CONVENTION.md`** — file-naming rules (flat, kebab-case, plural),
  record-shape rules (money as integer minor units, ISO 8601 `Z` timestamps), FK
  conventions, lifecycle-coverage requirement, anti-patterns.

## Validator

A single script drives all correctness checks:
`apps/web/scripts/validate-mock-data.mjs`.

Run it with:

```bash
# From the workspace root
pnpm mock:validate

# From the app
pnpm --filter @academorix/dashboard mock:validate

# Direct, with JSON output for CI
node apps/web/scripts/validate-mock-data.mjs --json
```

The validator asserts:

1. Every JSON file parses.
2. `_manifest.json` matches the files on disk exactly (no orphans in either
   direction).
3. Every `<name>_id` foreign key resolves to a real record in the target file.
4. Every polymorphic FK (`<name>_type` + `<name>_id`) resolves after dispatching
   on the type discriminator. Currently: `documents.owner_type/id`,
   `approval-tasks.approvable_type/id`, `ai-embeddings.source_type/id`,
   `resource-bookings.activity_type/id`, `credentials.holder_type/id`,
   `passes.holder_type/id`, and the `from_scope`/`to_scope` objects on
   `athlete-transfers` and `staff-transfers`.
5. Every declared state machine (29 today) has at least one record per state.
6. Every module in the manifest either has ≥1 fixture or is explicitly listed as
   by-design empty.

Exit code is 0 on success, 1 on any failure. Any warning printed to stderr
indicates a design decision (e.g.,
`resource-bookings.activity_type = "blackout"` has no linked activity by
design).

## Where it plugs into CI

- `pnpm quality` at the workspace root now runs the validator alongside format
  check, ESLint, typecheck, and Knip.
- `.lintstagedrc.mjs` runs the validator on any staged change under
  `apps/web/public/data/**` or on the validator script itself. Husky's
  `pre-commit` hook picks that up automatically.
- Anything that touches this folder must pass the validator before landing.

## The 55-module coverage map (business overview)

For the business-level map of every module and which files back it, see
`_manifest.json`. The blueprint at
`backend/.ref/docs/DOMAIN_MODULES_BLUEPRINT.md` is the canonical description of
each module's responsibility.

## Adding a new fixture

1. Confirm no existing file covers the concept (see `_manifest.json`).
2. Register the file in `_manifest.json` with
   `{ modules: [...], description: "..." }`.
3. Register any new ID prefix in `SHARED_IDS.md` §2.
4. Add records covering every state in the entity's state machine.
5. Update the ID indexes referenced from the validator if the file introduces
   new FK relationships.
6. Run `pnpm mock:validate` — it must exit 0.

## Adding a new record

1. Use canonical IDs from `SHARED_IDS.md` §3 when referencing shared resources
   (users, athletes, staff, invoices, etc.). Do not invent parallel IDs.
2. Every FK must resolve to a real record in the target file. If you're adding a
   synthetic scenario, prefix the id with the resource's normal prefix + a
   `_synth` suffix and add a `notes` field explaining the record.
3. Every mutation-tracking table has `created_at`/`updated_at` in ISO 8601 with
   `Z`.
4. Money is `{ amount_minor: <int>, currency: "USD" }`. No floats. No strings.
5. Run `pnpm mock:validate` before you commit.

## Deleting or renaming a file

1. Grep the frontend code for hard-coded fetches to that file name.
2. Update `_manifest.json` (both `files` and, if relevant, `coverage`).
3. Update `SHARED_IDS.md` §3 if any IDs move around.
4. Update the FK tables in `apps/web/scripts/validate-mock-data.mjs`.
5. Run `pnpm mock:validate`.

## Design decisions worth knowing

- **Flat layout.** All files live directly under `/public/data/` with no
  folders. Prefixes cluster related files (`athlete-*`, `staff-*`, `feature-*`,
  etc.). URL stability is more valuable than a folder tree at this size.
- **Money.** Always integer minor units + currency code. `4500 USD` = $45.00.
  Never decimals, never floats.
- **Timestamps.** ISO 8601 with `Z`. Dates that are date-only use `YYYY-MM-DD`.
- **Tenant scoping.** Every record carries `tenant_id`. `null` is reserved for
  centrally-defined records (retention policies, benchmarks, some report
  definitions, `people`).
- **Cross-cutting fixtures.** `users.json`, `audits.json`, `notifications.json`,
  `documents.json`, `grants.json`, etc. do not carry a module prefix. They are
  consumed by many modules; the manifest lists every consumer.
- **Synthetic records.** Records whose sole purpose is to demonstrate a scenario
  (e.g., `mat_5_synth`, `pay_1007_synth`) end in `_synth` and carry a `notes`
  field explaining what they demonstrate. External-partner entities (e.g.,
  `tm_ext_eagles`, `tnt_external_seaside`) carry `is_external: true`.

## Related backend material

- `backend/.ref/docs/DOMAIN_MODULES_BLUEPRINT.md` — 55-module business
  blueprint.
- `backend/.ref/docs/IDENTITY_AND_TENANCY_SPEC.md` — tenancy + auth + RBAC
  contract.
- `backend/.kiro/specs/*/` — per-module specs (requirements / design / tasks)
  for the modules we've committed to.

---

_Last updated: 2026-07-02 · Owner: this repo · Version: 1_
