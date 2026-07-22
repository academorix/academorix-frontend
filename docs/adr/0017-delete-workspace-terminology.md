# ADR 0017 — Delete `Workspace` terminology; canonical noun is `Tenant`

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Product + backend
architecture

## Context

The pre-2026 backend used two different English words for the same aggregate:

- **`Workspace`** — in the frontend UI copy, the mobile-app copy, and in early
  scaffolding of the tenancy module (`Workspace`, `WorkspaceMembership`,
  `workspaces` table, `workspace_memberships` pivot).
- **`Tenant`** — in every downstream package that consumed multi-tenancy (Stancl
  vendor contracts, `BelongsToTenant` trait, `tenant_id` FK column, `tenant.php`
  config file).

The words denote the SAME row — the customer-facing paying account. The split
was not intentional. It emerged when the frontend picked "workspace" as the
tenant-facing display label (matches Slack + Notion) while the backend picked
"tenant" (matches the vendor Stancl package). Once both words hit shipped code,
every reviewer routinely asked which one the current file was referring to.

Concrete cost:

- **Two class hierarchies to maintain.** `Workspace` model + `Tenant` model, one
  FK relationship on each, drift-prone every time the schema moved.
- **Two configuration nouns.** `WorkspaceSettings` vs `TenantSettings`, two
  places to change one setting.
- **Two pivots for the User-to-account link.** `WorkspaceMembership` and
  `TenantMember` sat side-by-side, referencing the same rows, with slightly
  different lifecycle hooks.
- **PR reviewer overhead.** "Should I say workspace or tenant here?" became a
  question on every schema PR.

The frontend UI label ("Workspace" as user-facing display copy) is legitimate —
matches consumer product convention. But that's a UI DECISION, not a backend
concept. The backend needs one word for the row.

## Options considered

1. **Rename everything to `Workspace` (reject).** Would fight every vendor we
   integrate — Stancl calls its own table `tenants` and uses `Tenant` in every
   trait + contract; renaming the workspace-facing rows to `workspaces` would
   leave `tenant_id` on the FK columns and re-introduce the drift the rename was
   supposed to fix.

2. **Keep both terms; document the mapping (reject).** Every reviewer would
   still need to remember the mapping per file. Documentation is not a
   substitute for a single canonical noun.

3. **Rename everything to `Tenant` at the backend; keep `Workspace` as a pure UI
   display label (chosen).** Backend speaks Tenant everywhere. Frontend is free
   to render "Workspace" as label text. The two are distinct layers with
   distinct concerns.

## Decision

### D1 — `Tenant` is the canonical backend noun

Every backend class, table, column, config key, event name, and log context
field names the aggregate `Tenant`. Every reject entry below becomes a
code-review red flag:

| Word                   | Status                     | Correct                                   |
| ---------------------- | -------------------------- | ----------------------------------------- |
| `Workspace`            | Rejected                   | `Tenant`                                  |
| `Workspaces`           | Rejected                   | `Tenants` (list / index / plural)         |
| `workspace_`           | Rejected column prefix     | `tenant_`                                 |
| `Workspace`-           | Rejected class-name prefix | `Tenant`-                                 |
| Namespace `Workspace\` | Rejected                   | `Tenancy\` (module) / `Tenant\` (per row) |

### D2 — Frontend label copy is free to use "Workspace"

The frontend renders a Tenant as "Workspace" in its user-facing label text —
that's a UI DECISION. Backend does not care what the frontend labels the row;
the wire contract carries `tenant`, `tenants`, `tenant_id`. Label translation
happens at the render layer.

### D3 — `TenantMember` is the canonical pivot noun

The row that pins a User to a Tenant is `TenantMember`, not `TenantMembership`,
not `WorkspaceMembership`. The pivot table is `tenant_members`. Every prior name
renames:

| Prior                   | Canonical        |
| ----------------------- | ---------------- |
| `Workspace` (model)     | `Tenant`         |
| `WorkspaceMembership`   | `TenantMember`   |
| `TenantMembership`      | `TenantMember`   |
| `workspaces` (table)    | `tenants`        |
| `workspace_memberships` | `tenant_members` |
| `tenant_memberships`    | `tenant_members` |

The class name distinguishes `TenantMember` from `Finance\Membership` (the paid
contract enrolling an Athlete on a plan) — two aggregates that share an English
root but are otherwise unrelated. See `.kiro/steering/hierarchy.md` §1c
"Membership — do NOT confuse" for the disambiguation.

### D4 — Guardrails

- **`NoWorkspaceInBackendRule`** — the architecture rule (under
  `packages/backend/compliance/architecture/`) rejects `Workspace` in any
  backend class name, namespace, table name, or column name.
- **`NoTenantMembershipTokenRule`** — the architecture rule rejects
  `TenantMembership` in any class name or namespace (the correct name is
  `TenantMember`).
- **Standards-steward sweep** — Phase E of the compliance sweep runs a grep for
  residual `Workspace` strings across docblocks + lang files and renames them.

### D5 — Single-shot rename, no aliases

Both rules refuse an "aliased" migration where `Workspace` and `Tenant` coexist.
The rename is single-shot per package. Every downstream reference (imports, use
statements, config keys, event names, docs) migrates in the same commit as the
rename.

## Consequences

**Positive:**

- **One canonical noun.** Reviewers never ask which word to use.
- **Vendor alignment.** Stancl's contracts land unchanged; every cross-tenant
  guardrail (`BelongsToTenant`, `TenantScope`) works out of the box.
- **Clean UI/backend seam.** Frontend picks its own display label without the
  backend caring.

**Negative:**

- **~49 residual `Workspace` strings** as of 2026-07-21, concentrated in
  docblocks + lang files of the framework packages. Phase E of the compliance
  sweep migrates them.
- **Frontend cognitive overhead.** Developers who touch both surfaces need to
  remember "backend says Tenant, frontend says Workspace at the label layer".
  Steering + hierarchy.md §1 keep the mapping explicit.

**Neutral:**

- **The word "Tenant" carries slight enterprise-B2B connotation** that some UI
  designers dislike. The UI label "Workspace" preserves the consumer-friendly
  framing.

## Related work

- `.kiro/steering/hierarchy.md` §1a — the terminology lock-in table this ADR
  codifies.
- `.kiro/steering/hierarchy.md` §1c "Workspace — no longer a domain word" — the
  explicit deprecation note.
- `packages/backend/compliance/architecture/` — the two rules
  (`NoWorkspaceInBackendRule` + `NoTenantMembershipTokenRule`) that enforce this
  ADR at CI time.
- ADR-0020 — Bootstrapper vs TenancyHook are two different concepts (unrelated
  to this rename, but references the same tenancy vocabulary).
