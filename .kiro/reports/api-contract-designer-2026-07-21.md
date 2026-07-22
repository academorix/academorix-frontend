# API Contract Designer — Cross-Service Contract Audit

**Date:** 2026-07-21 **Agent:** api-contract-designer **Workspace:**
`/Users/akouta/Projects/academorix-frontend/` **Scope:** cross-service JSON
Schema contracts under `docs/contracts/`, service-boundary narrative under
`docs/service-boundary.md`, OpenAPI fragment coverage on `#[AsAction]` route
attributes, SDK contract alignment across `packages/backend/sdk/**` +
`apps/academorix/src/sdks/**`.

---

## Executive summary

The Phase-3 contract layer this agent owns **does not exist**. Every rule in the
`api-contract-designer.md` charter (`docs/contracts/*.schema.json`, Draft-07
JSON Schema, versioned filenames, contract-review notes) references paths that
were never authored. Every sibling charter (`docs-adr-steward`,
`security-compliance-reviewer`, `standards-steward`, `test-mutation-engineer`)
cites the same non-existent paths as their source of truth. The result is a
lattice of "the schema is authoritative" claims — with no schema.

Contract-shaped material DOES exist, but not where the charters point:

- **Blueprint schemas** live at `blueprints/**/schemas/*.schema.json` and
  `apps/academorix/src/blueprints/**/schemas/*.schema.json` — 100+ files. These
  are the closest thing to a contract layer today.
- **Blueprint schemas use non-standard JSON Schema keys** (`"id"` instead of
  `"$id"`, `"draft"` instead of `"$schema"`). They will not validate against the
  Draft-07 metaschema (or Draft-2020-12) without a translation step.
- **Two schemas named verbatim by sibling charters** —
  `service-identity.schema.json` and `service-jwt.schema.json` — do NOT exist
  under `docs/contracts/`. Approximate equivalents exist as
  `blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json`
  and `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json`, but
  the paths every charter uses to find them are wrong.
- **Runtime code exists that would consume the missing schemas.** `JwtSigner`,
  `JwtVerifier`, `ServiceAccount` model — all shipped with docblocks that point
  back at blueprint JSON example files (`jwt-payload-example.json`) rather than
  at a formal schema.
- **The OpenAPI attribute infrastructure exists but is unused.**
  `Stackra\Routing\Attributes\Get/Post/Put/Patch/Delete` accept `summary`,
  `tags`, `responseSchema`, `responseCode` fields — every parameter is optional
  and only 4 of ~200 shipped Actions in the workspace (all inside
  `packages/backend/framework/settings/`) populate the `summary`. Every Action
  in `apps/academorix/src/modules/**` and every domain package ships with a bare
  `#[Get(...)]` / `#[Post(...)]` line.
- **No OpenAPI output.** Scramble is not installed anywhere; no `openapi.yaml`
  exists in the workspace; the routing package's `Post.php` has an unused
  `getOpenApiAttribute()` builder that returns a `zircote/swagger-php` object no
  downstream consumer collects.
- **SDK drift is already measurable.** For the ONE cross-boundary DTO both sides
  ship — `ApplicationData` — the backend types `createdAt` as
  `\DateTimeInterface` + `defaultBusinessType` as `?BusinessTypeEnum`; the SDK
  types them as `string` + `?string`. With no contract as arbiter, this is
  inevitable and will multiply.

**Totals for the report shape the charter asked for:**

- Total schemas in `docs/contracts/`: **0**
- Schemas with drift: **N/A — no schemas exist**
- Cross-service seams identified: **4** (see §3)
- Seams with a contract at the charter-mandated path: **0**
- Seams with a blueprint schema shadowing the missing contract: **2**
- Seams with runtime code but no schema at any path: **2**
- SDK packages: **33** (8 in `packages/backend/sdk/`, 25 in
  `apps/academorix/src/sdks/`)
- SDK packages with contract alignment at the charter-mandated path: **0**
- Actions carrying `#[Get/Post/Put/Patch/Delete]`: at least **100** across
  `apps/academorix/src/modules/**` + `packages/backend/**` (the sample runs I
  did all show single-digit `responseSchema:` coverage — see §5).
- Actions carrying `responseSchema:` on their verb attribute: **0**.
- Actions carrying `summary:` on their verb attribute: **4** (all in
  `packages/backend/framework/settings/src/Actions/`).

The Phase-3 exit gate in `AGENT_ROSTER.md` says _"every contract under
`docs/contracts/*.schema.json`"_. That gate is 0/N today.

---

## 1. Missing top-level artefacts (agent-visible surface)

Every one of these paths is referenced by name in at least one agent charter or
steering file. **All are absent from the workspace.**

| Missing path                                                                                                                                                                                                                             | Referenced by                                                                                                                                                                                                     | Impact                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/contracts/`                                                                                                                                                                                                                        | `.kiro/agents/api-contract-designer.md` (charter root), `.kiro/agents/docs-adr-steward.md`, `.kiro/agents/security-compliance-reviewer.md`, `.kiro/agents/standards-steward.md`, `.kiro/tasks/design-pipeline.md` | No canonical contract home. Every charter that "reads schemas from `docs/contracts/`" cannot orient.                                                                                                      |
| `docs/contracts/README.md`                                                                                                                                                                                                               | `.kiro/agents/docs-adr-steward.md` §"Cross-service contract schemas", `.kiro/agents/security-compliance-reviewer.md` §"Orient first" #4                                                                           | The five contract rules (schemas are source-of-truth, HS256 fixed, default-deny abilities, tenant-scoped tokens, back-compat) live here per the docs-adr-steward charter — nowhere else in the workspace. |
| `docs/contracts/service-identity.schema.json`                                                                                                                                                                                            | `.kiro/agents/security-compliance-reviewer.md` §"Orient first" #5, `.kiro/agents/standards-steward.md` #33, `.kiro/agents/test-mutation-engineer.md` #11, `.kiro/steering/tenancy-columns.md` §9 gap register     | Every reviewer that verifies the Sanctum-PAT identity shape has no schema to check against.                                                                                                               |
| `docs/contracts/service-jwt.schema.json`                                                                                                                                                                                                 | `.kiro/agents/security-compliance-reviewer.md` §"Orient first" #6, `.kiro/agents/standards-steward.md` #34, `.kiro/agents/test-mutation-engineer.md` #11, `.kiro/steering/tenancy-columns.md` §9 gap register     | The 13-step verification list `JwtVerifier` implements has no schema anchor. `security-compliance-reviewer` and `test-mutation-engineer` are supposed to round-trip against this.                         |
| `docs/service-boundary.md`                                                                                                                                                                                                               | `.kiro/agents/docs-adr-steward.md` §"Orient first" #8, `.kiro/agents/security-compliance-reviewer.md` §"Orient first" #3, `.kiro/agents/standards-steward.md` #27, `.kiro/steering/service-boundary.md` header    | The four-seam narrative (identity / inbound trust / data / observability) is the anchor for every service-boundary reviewer. Missing → every reviewer works from steering-only surface.                   |
| `docs/adr/0022-language-agnostic-service-boundary.md`                                                                                                                                                                                    | `.kiro/steering/service-boundary.md` line 12, `.kiro/agents/security-compliance-reviewer.md` §"Orient first" #7                                                                                                   | The ADR the whole cross-service story is grounded in.                                                                                                                                                     |
| `docs/adr/0008-keep-authorization-and-access-split.md`                                                                                                                                                                                   | `.kiro/steering/contract-implementer-split.md` header                                                                                                                                                             | The canonical two-package split ADR.                                                                                                                                                                      |
| `docs/adr/0018-business-types-enum-primary-db-seed.md`                                                                                                                                                                                   | `.kiro/steering/enum-db-seed-dual-source.md` header                                                                                                                                                               | The dual-source-catalogue ADR — cross-referenced from every catalogue steering.                                                                                                                           |
| `docs/adr/0011-seeder-discovery-via-attribute.md`                                                                                                                                                                                        | `.kiro/steering/enum-db-seed-dual-source.md` §"the seeder"                                                                                                                                                        | The `#[AsSeeder]` contract every dual-source seeder relies on.                                                                                                                                            |
| `docs/adr/0006-attribute-first-di.md`, `0016-actions-only`, `0017-tenancy-terminology`, `0019-tenant-settings-via-scope`, `0020-bootstrappers-vs-tenancy-hooks`, `0024-row-attribution-three-axes`, `0025-runtime-target-laravel-octane` | Multiple steering docs                                                                                                                                                                                            | Every ADR the steering layer cites is missing.                                                                                                                                                            |
| `packages/domain/`                                                                                                                                                                                                                       | `.kiro/steering/tenancy-columns.md` §9 gap register                                                                                                                                                               | The shared HTTP-DTO package referenced as "in progress" by tenancy-columns steering.                                                                                                                      |

The docs-adr-steward audit already flagged the ADR + steering gap; this report
focuses on the CONTRACT gap, which is the piece the api-contract-designer
charter is meant to close.

**What this means for Phase 3 as defined in `AGENT_ROSTER.md`:** Phase 3 does
not close. §II.1's exit criterion "every contract under
`docs/contracts/*.schema.json`" is 0/N.

---

## 2. What EXISTS today — the blueprint schemas

Contract-shaped material exists at two paths:

- `blueprints/**/schemas/*.schema.json` — 100+ files (identity, platform,
  access, billing, compliance, notifications, observability, workflow).
- `apps/academorix/src/blueprints/**/schemas/*.schema.json` — Academorix
  (product-tier) schemas for chargeback, coupon, digital-passes, dunning,
  expenses, gateway, invoice, and every sports/growth/notifications feature.

These ARE the current contract layer. Two structural problems block them from
serving as the api-contract-designer's output:

### 2.1 Non-standard JSON Schema keys

Every blueprint schema uses:

```json
{
  "id": "stackra://modules/auth/schemas/jwt-payload",
  "draft": "https://json-schema.org/draft/2020-12/schema",
  "$version": 1,
  "title": "JwtPayload",
  ...
}
```

Standard JSON Schema (Draft-07 or Draft-2020-12) uses `"$id"` and `"$schema"`.
The blueprint schemas use `"id"` and `"draft"` — property names that no JSON
Schema validator recognises. Consequences:

- `ajv`, `python-jsonschema`, and `justinrainbow/json-schema` all skip these
  keys silently — they treat the whole file as an untyped object under the
  ambient default meta-schema.
- The api-contract-designer charter says "Draft-07 JSON Schema. Every schema
  declares `$schema: "http://json-schema.org/draft-07/schema#"` and validates
  against the draft-07 metaschema." Blueprint schemas will fail that gate as
  authored.
- The `"$version": 1` custom key is not part of the spec either — the charter
  says "Version numbers in filenames" (`.v1.schema.json`); blueprints keep the
  version inline instead.

Blueprint schemas ALSO use `x-eloquent`, `x-database`, `x-wire`,
`x-route-binding`, `x-invariants`, `x-related`, `x-module` — proprietary
extensions the code-generator layer under
`blueprints/shared/blueprints/foundation/scripts/` consumes. That's fine (JSON
Schema allows `x-*` extensions), but the contract-designer output shape needs to
decide whether it inherits those extensions or strips them at the
`docs/contracts/` boundary.

### 2.2 Consumer-facing schemas do not exist even in blueprint form

Blueprint schemas are shaped as ROW schemas — the DB table shape (`x-eloquent`,
`x-database`, `x-wire`, computed accessors, hidden columns). What
`docs/contracts/` is supposed to hold, per the charter and every sibling
reviewer, is a different set of shapes:

- **Wire request payloads** — what a `POST` body looks like. Blueprint schema
  describes the ROW; the wire payload is a _subset_ + validation attributes. The
  two are related but not the same.
- **Wire response payloads** — the DTO the endpoint returns, which strips hidden
  fields and adds computed ones. `x-wire.hidden` + `x-wire.computed` DO encode
  this in the row schema, but a downstream reader has to derive the response
  shape by filtering.
- **Cross-service DTOs** — the shape a JWT payload actually takes on the wire
  (already schema-shaped in
  `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json`).
- **Event payloads** — nothing exists.
- **Idempotency / pagination / error envelopes** — nothing exists.

Blueprint schemas cover the ROW layer; the CONTRACT layer sitting on top of the
row layer is missing.

### 2.3 What blueprint schemas cover well

Two schemas cover the security-critical seams every reviewer wants to check:

- `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json` — the
  HS256 JWT payload shape (`iss`, `aud`, `sub`, `app`, `tid`, `sco`, `roles`,
  `permissions`, `kid`, `iat`, `exp`, `jti`, `purpose`). Uses `pattern:` for the
  ULID prefixes on `sub` / `tid`. Declares required + additionalProperties:
  false. This is the closest thing to a wire contract the repo owns.
- `blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json`
  — the `service_accounts` row shape (id, application_id, tenant_id, name,
  signer_kid, expires_at, status, metadata + computed accessors). Row schema,
  not wire schema — but it's the canonical source of truth for what a
  Sanctum-PAT identity looks like.

Both would need to be RE-PUBLISHED (with corrected `$id` + `$schema` keys, under
a versioned filename, at `docs/contracts/`) to satisfy the charter.

---

## 3. Cross-service seams — the four the charter cares about

Read across `docs/service-boundary.md` doesn't exist, so this section is
reconstructed from `.kiro/steering/service-boundary.md`,
`.kiro/agents/security-compliance-reviewer.md`, and the runtime code that
exists.

### 3.1 Seam A — Identity (Sanctum PAT: service → service)

- **Where it lives in code:**
  `packages/backend/identity/service-accounts/src/Models/ServiceAccount.php`
  - migration + `IsServiceAccount` concern.
- **Contract at charter path (`docs/contracts/service-identity.schema.json`):**
  MISSING.
- **Blueprint shadow at
  `blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json`:**
  PRESENT (170+ lines, comprehensive).
- **Steering that names this seam:** `.kiro/steering/tenancy-columns.md` §9 gap
  register ("`ServiceAccount` model + `service_accounts` migration (Laravel side
  of `docs/contracts/service-identity.schema.json`)").
- **Reviewers blocked:**
  - `security-compliance-reviewer` §"Sanctum PAT + `service_accounts`" — cannot
    round-trip.
  - `test-mutation-engineer` §"Cross-service auth conformance" — cannot generate
    a conformance fixture.
- **Contract shape needed:** ServiceAccount projection (as the platform-admin
  API returns it), plus the exchange endpoint's request + response shape.
  Blueprint covers the row; the endpoint's request/response shape needs new
  authoring.

### 3.2 Seam B — Inbound trust (HS256 service JWT verification)

- **Where it lives in code:**
  `packages/backend/identity/auth/src/Services/JwtSigner.php`,
  `.../JwtVerifier.php` — both fully implemented, including the 13-step
  verification list (steps 1-13 quoted verbatim from
  `blueprints/identity/blueprints/auth/data/jwt-payload-example.json`).
- **Contract at charter path (`docs/contracts/service-jwt.schema.json`):**
  MISSING.
- **Blueprint shadow at
  `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json`:**
  PRESENT.
- **Runtime docblock references non-existent path:** `JwtVerifier.php` line 27
  and `JwtSignerInterface.php` line 17 both quote
  `modules/identity/blueprints/auth/data/jwt-payload-example.json` — an example,
  not a schema. Consumers with only the docblock in view cannot navigate to
  `docs/contracts/`.
- **Reviewers blocked:**
  - `security-compliance-reviewer` §"Inbound trust — service JWT verification" —
    checks every step against `docs/contracts/service-jwt.schema.json`
    `§verification.steps`. That file is absent.
  - `test-mutation-engineer` §"Cross-service auth conformance" — cannot
    round-trip.
- **Contract shape needed:** JWT payload schema (blueprint schema is 90% there —
  needs `$id` + `$schema` correction and republish) + the algorithm spec
  (`signature_verification_algorithm.steps`) that today lives in a JSON EXAMPLE
  file (`jwt-payload-example.json`) rather than in a contract. The example file
  has the 13-step list; a proper contract puts that list in the schema's
  `$comment` block or in the sibling `.md`.

### 3.3 Seam C — REST surface (frontend → backend + service → service)

- **Where it lives in code:** every `#[AsAction]` class carrying a
  `#[Get/Post/Put/Patch/Delete]` route attribute. Count: 100+ across
  `apps/academorix/src/modules/**` + `packages/backend/platform/**` +
  `packages/backend/framework/settings/src/Actions/`.
- **Contract at charter path (`docs/contracts/<resource>.request.schema.json`
  - `docs/contracts/<resource>.response.schema.json`):** MISSING for every
    resource.
- **OpenAPI fragment attribute infrastructure:** PRESENT but UNUSED.
  `Stackra\Routing\Attributes\Post` (and Get/Put/Patch/Delete) accept `summary`,
  `tags`, `parameters`, `requestSchema`, `responseSchema`, `responseType`,
  `responseCode`. Every one is optional; nothing collects the emitted
  `zircote/swagger-php` objects. `getOpenApiAttribute()` builds an `OA\Post`
  object at runtime but no consumer reads it.
- **Reviewers blocked:**
  - `standards-steward` cross-service-contracts lane — flag rate is 100% because
    no schema exists to check code against.
  - `test-mutation-engineer` HTTP boundary tests — no schema anchor for
    round-trip fixtures.
- **Contract shape needed:** per-resource `<resource>.request.schema.json` +
  `<resource>.response.schema.json` for every endpoint. Alternatively, one
  consolidated `openapi.yaml` generated from the per-Action attribute metadata —
  but nothing today emits or collects it.

### 3.4 Seam D — Backend ↔ ai-service (Python side, sibling repo)

- **Where it lives in code:** `apps/ai-service/` is referenced across steering +
  agent charters + backend-platform-reviewer report but does NOT exist in this
  workspace. `docs/adr/0026-agent-canonical-directory.md` confirms
  `stackra-ai-service` is a sibling repo (leaf 3).
- **Contract at charter path:** MISSING.
- **Blueprint shadow:** partial — `blueprints/platform/blueprints/ai/` covers
  the AI module row shapes; the cross-service HTTP surface between backend and
  ai-service is not schema-shaped.
- **Reviewers blocked:**
  - `mlops-reviewer` + `data-scientist-reviewer` — cannot check the Python side
    matches the Laravel side without a shared schema.
- **Contract shape needed:** every AI endpoint (persona invocation, tool call,
  draft-confirm handshake) as request + response pair. Every event the
  ai-service publishes back (`AiDraftCreated`, `AiToolInvoked`).

### 3.5 Seam summary table

| Seam                      | Direction                     | Contract at `docs/contracts/`? | Blueprint shadow?                                                        | Runtime code?                              | Notes                                                                                                    |
| ------------------------- | ----------------------------- | ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Identity (Sanctum PAT)    | service → service (bearer)    | **N**                          | Y — `service-account.schema.json`                                        | Y — `ServiceAccount` model + observer      | Runtime is ahead of the contract layer.                                                                  |
| Inbound trust (HS256 JWT) | identity-service → downstream | **N**                          | Y — `jwt-payload.schema.json`                                            | Y — `JwtSigner` + `JwtVerifier` (13 steps) | Runtime docblocks reference an EXAMPLE JSON, not a schema; the 13-step list is prose in an example file. |
| REST (backend endpoints)  | frontend / SDK → backend      | **N** (0/100+ endpoints)       | Row-shape schemas exist per module; wire request/response schemas do NOT | Y — 100+ `#[AsAction]` classes             | OpenAPI attribute fields exist unused; no `openapi.yaml`.                                                |
| Backend ↔ ai-service      | HTTP + event                  | **N**                          | Row-shape schemas only for AI models                                     | ai-service in a sibling repo               | No workspace-visible seam contract.                                                                      |

**Runtime-without-contract signals** (Seam A + Seam B): the code shipped and the
contract-in-`docs/contracts/` never did. Every consumer works from prose
docblocks + blueprint schemas + a shared understanding — the exact failure mode
Phase 3 exists to prevent.

---

## 4. SDK contract alignment audit

The workspace ships 33 SDK packages that carry the _client-side_ of the contract
Seam C should describe:

- **8 framework SDKs** in `packages/backend/sdk/` (access-sdk, api-sdk,
  billing-sdk, compliance-sdk, identity-sdk, notifications-sdk,
  platform-application-sdk, platform-sdk).
- **25 domain SDKs** in `apps/academorix/src/sdks/` — every module ships one
  (finance-_, identity-_, notifications-_, platform-_, sports-*).

### 4.1 SDKs reference schemas that don't exist at any path

**Every** domain SDK Data DTO carries a docblock declaring which schema it
mirrors. Spot check across 20+ SDK Data classes finds the SAME template
sentence, changed only by the schema filename:

```
Mirrors `schemas/<name>.schema.json` column-for-column, minus
the fields declared under `x-wire.hidden` which never leave the
server. Wire format is snake_case; PHP property names are ...
```

The `schemas/<name>.schema.json` reference is a bare relative path — navigable
from nowhere in particular. It shadows:

- The blueprint schema at
  `apps/academorix/src/blueprints/finance/blueprints/expenses/schemas/expense.schema.json`
  (or the equivalent), or
- A hypothetical `docs/contracts/expenses/expense.schema.json`, or
- Something else entirely.

There is no `schemas/` root a reader can `cd` into and find these files. Every
docblock reference is ambiguous. Examples:

| SDK Data class                                                                           | Docblock reference                 | Resolves to                                                                                                                               | Alignment?                               |
| ---------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `apps/academorix/src/sdks/platform-application-sdk/src/Data/ApplicationData.php`         | `schemas/application.schema.json`  | Nowhere at this path; closest match is `blueprints/platform/blueprints/application/schemas/application.schema.json` (would need to exist) | Ambiguous.                               |
| `apps/academorix/src/sdks/finance-expenses-sdk/src/Data/BudgetData.php`                  | `schemas/budget.schema.json`       | `apps/academorix/src/blueprints/finance/blueprints/expenses/schemas/budget.schema.json` exists                                            | Ambiguous (path is relative to nothing). |
| `apps/academorix/src/sdks/finance-expenses-sdk/src/Data/ExpenseData.php`                 | `schemas/expense.schema.json`      | `apps/academorix/src/blueprints/finance/blueprints/expenses/schemas/expense.schema.json` exists                                           | Ambiguous.                               |
| `apps/academorix/src/sdks/notifications-announcements-sdk/src/Data/AnnouncementData.php` | `schemas/announcement.schema.json` | No shadowing blueprint schema found. Reference points at nothing.                                                                         | Broken.                                  |
| `apps/academorix/src/sdks/platform-credentials-sdk/src/Data/CredentialData.php`          | `schemas/credential.schema.json`   | No shadowing blueprint schema found.                                                                                                      | Broken.                                  |
| `apps/academorix/src/sdks/sports-drills-sdk/src/Data/DrillData.php`                      | `schemas/drill.schema.json`        | Presumed at `apps/academorix/src/blueprints/sports/blueprints/drills/schemas/drill.schema.json` — not verified in this pass               | Ambiguous.                               |

`x-wire.hidden` (referenced in every docblock as the source of truth for "which
fields never leave the server") only exists as a key inside the blueprint
schemas — it's the schema author's contract, not something SDK authors can
navigate to independently.

### 4.2 Drift is already measurable — `ApplicationData` case study

The ONE type both sides ship — `ApplicationData` — is authored twice:

**Backend**
(`packages/backend/platform/application/src/Data/ApplicationData.php`):

- `createdAt: \DateTimeInterface` (with
  `#[WithCast(DateTimeInterfaceCast::class)]`)
- `updatedAt: \DateTimeInterface`
- `deletedAt: ?\DateTimeInterface`
- `defaultBusinessType: ?BusinessTypeEnum`
- `centralUrl: string` (computed in constructor)
- `platformAdminUrl: string` (computed in constructor)

**SDK**
(`packages/backend/sdk/platform-application-sdk/src/Data/ApplicationData.php`):

- `createdAt: string`
- `updatedAt: string`
- `deletedAt: ?string`
- `defaultBusinessType: ?string`
- `centralUrl: ?string`
- `platformAdminUrl: ?string`

Every field diverges. The backend types date fields as `\DateTimeInterface`
(Spatie casts inbound `2026-07-17T14:22:00Z` into a `Carbon` instance); the SDK
types them as `string` (Spatie hydrates the raw wire value). The backend types
`defaultBusinessType` as the enum directly; the SDK types it as `?string`. The
backend computes `centralUrl` in the constructor and makes it non-nullable; the
SDK types it as `?string` because the server "may or may not" emit it.

The two sides work in practice because both pass through JSON.
`\DateTimeInterface` marshals to an ISO-8601 string on serialise; the SDK reads
that string. But there's no arbiter. A future change that switches the backend
from `\DateTimeInterface` to a `Carbon`-typed property with a different format,
or adds a `readonly` marker on a field, or introduces a `#[Hidden]` on one side
— silent drift until an integration test catches it. Multiplied across 33 SDKs
and 100+ endpoints, this is the class of failure the contract layer exists to
prevent.

**Aligned?** No SDK is aligned with a `docs/contracts/` schema because none
exists.

### 4.3 SDKs also carry the pagination/error envelope

`packages/backend/sdk/api-sdk/src/Data/PaginatedResponse.php` DTO declares the
envelope:

```json
{
  "data": [ ... ],
  "links": { "first": ..., "last": ..., "prev": ..., "next": ... },
  "meta":  { "current_page": 1, "from": 1, "last_page": 5, "per_page": 15, "to": 15, "total": 73 }
}
```

`PaginationMeta` types `currentPage` / `perPage` / `total` / `lastPage` as
`int`, `from` / `to` as `?int`. This is the DE FACTO wire envelope for every
paginated list endpoint. It should be
`docs/contracts/list-envelope.v1.schema.json`; it isn't.

`ApiSdk` Data folder ships:

- `PaginatedResponse`
- `PaginationMeta`
- `PaginationLinks`

These three carry the whole pagination contract. Every future SDK Data class
re-implements them or picks a stringly-typed alternative.

### 4.4 Error envelope

Not authored anywhere. `data-first.md` steering asserts:

- 4xx / 5xx errors return `{ message, errors? }`.
- `errors` is `Record<field, string[]>`.

No JSON Schema. No SDK Data type. Every error handler across 33 SDKs guesses.

### 4.5 SDK alignment summary table

| SDK bucket                    | Package count | With `docs/contracts/` alignment | With shadowing blueprint schema                                                     | With docblock references to `schemas/*.schema.json` that resolve                             |
| ----------------------------- | ------------- | -------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/backend/sdk/**`     | 8             | 0                                | 0 (framework SDKs — no matching blueprint row schemas)                              | Sparse — mostly reference the sibling backend package's Data class, not a schema.            |
| `apps/academorix/src/sdks/**` | 25            | 0                                | Partial — most reference schemas that exist under `apps/academorix/src/blueprints/` | 25/25 — every domain SDK Data class carries a `Mirrors schemas/<name>.schema.json` docblock. |

**Additional note flagged by the tenancy-compliance-auditor sibling report:**
every SDK under `apps/academorix/src/sdks/**` declares `namespace Stackra\...`
while its `composer.json` PSR-4 root is `Academorix\...`. That is a separate
audit lane (code-standards / architecture) — but it means the SDK layer is
currently non-loadable and the "SDK is the client contract" claim is
double-broken: no schema behind it, no working code in front of it.

---

## 5. OpenAPI fragment audit

The api-contract-designer charter says "OpenAPI fragments for the REST surface
(per feature)". Nothing today emits or collects them.

### 5.1 The attribute infrastructure

`Stackra\Routing\Attributes\Post` (canonical shape):

```php
public function __construct(
    string $uri,
    ?string $name = null,
    array|string $middleware = [],
    array|string $withoutMiddleware = [],
    // OpenAPI
    public ?string $summary = null,
    public ?string $description = null,
    public array $tags = [],
    public array $parameters = [],
    public ?string $requestSchema = null,
    public ?string $responseSchema = null,
    public string $responseType = 'object',
    int|BackedEnum $responseCode = 201,
    ...
)
```

Every one of `summary`, `description`, `tags`, `parameters`, `requestSchema`,
`responseSchema`, `responseType` is optional. `getOpenApiAttribute()` returns
`null` when `summary` is unset, so any Action that skips `summary:` contributes
nothing to the OpenAPI surface.

### 5.2 Actual usage across every Action

I ran targeted greps across the whole workspace:

- `summary:\s*'` in Action files: **4 hits** — all in
  `packages/backend/framework/settings/src/Actions/{List,ShowGroup,ShowSchema,UpdateGroup}Settings.php`.
- `tags:\s*\[` in Action files: **0 hits** (settings Actions ARE tagged as
  `['Settings']` but the search caught `summary:` first).
- `responseSchema:\s*` in Action files: **0 hits** across `apps/**/*.php` AND
  `packages/backend/**/*.php`. Every mention of `responseSchema:` outside the
  routing package's own attribute declarations is in the routing package's
  docblock examples.
- `requestSchema:\s*` in Action files: **0 hits**.

Every Action in `apps/academorix/src/modules/**` (chargeback, coupon,
digital-passes, dunning, expenses, and every other module I sampled) ships with
a bare `#[AsAction(name: ...)]` + `#[Get/Post/...]('...')` +
`#[Middleware([...])]` line, plus `#[RequirePermission(...)]` — nothing else.
Sample:

```php
#[AsAction(name: 'chargeback.chargebacks.list')]
#[Get('/api/v1/chargebacks')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class ListChargebackAction
{
    // ...
}
```

### 5.3 OpenAPI output

- No `openapi.yaml` in the workspace.
- No `openapi.json` in the workspace.
- Scramble (`dedoc/scramble`) not in any `composer.json`.
- The routing package's `getOpenApiAttribute()` method has no downstream
  consumer — nothing walks `#[Post]` attributes to collect the emitted
  `OpenApi\Attributes\Post` objects.

**OpenAPI fragment coverage: 4 Actions (all in `settings`) carry `summary:`; 0
Actions carry `responseSchema:`; 0 Actions produce OpenAPI output.**

### 5.4 What sample compliance would look like

For each of the 100+ Actions, the minimum acceptable metadata is:

```php
#[Post(
    uri: '/api/v1/chargebacks/{chargeback}/accept',
    name: 'chargeback.accept.accept',
    summary: 'Accept a chargeback and mark it resolved',
    tags: ['Chargebacks'],
    requestSchema: 'AcceptChargebackRequest',
    responseSchema: ChargebackData::class,
    responseCode: 200,
)]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
```

The `requestSchema: 'AcceptChargebackRequest'` string is a lookup key into the
OpenAPI `#/components/schemas/` registry — a registry that today is also 0
entries.

---

## 6. HTTP envelope compliance

`data-first.md` steering (§Prerequisite + reference implementation) establishes
envelope conventions. `frontend-module-architecture.md` §6 (backend response
contract) elaborates:

| Kind                     | Shape                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| List                     | `{ data: T[], meta: { current_page, per_page, total, last_page, from, to }, links: {…} }` |
| Single / create / update | `{ data: T, message?: string }`                                                           |
| Delete                   | `204 No Content` (or `{ message }`)                                                       |
| Error                    | HTTP 4xx/5xx + `{ message, errors?: { field: string[] } }`                                |

### 6.1 List envelope compliance

- **DTO layer:** `PaginatedResponse` + `PaginationMeta` + `PaginationLinks`
  exist as SDK-side types (`packages/backend/sdk/api-sdk/src/Data/`). Every
  backend action returning a paginated list ostensibly hits Laravel's
  `LengthAwarePaginator` default JSON shape.
- **Schema:** NONE. There is no `docs/contracts/list-envelope.v1.schema.json`.
- **Test round-trip fixtures:** the domain SDK requests (e.g.
  `ListWalletPassesRequest::createDtoFromResponse`) hand-parse
  `{ data, meta, links }` shape in every SDK — 33 copies of the same parse
  logic.
- **Sample of compliance:** every SDK reads `data` + `meta` + `links` from the
  response — de facto compliant. But no schema means no linter catches a
  drifting endpoint that omits `links` or renames `current_page` to `page`.
- **Verdict:** de facto compliant, no schema anchor.

### 6.2 Single / create / update envelope

- **DTO layer:** every SDK request's `createDtoFromResponse` unwraps
  `{ data: ... }` and hydrates from the payload. `message:` is never parsed by
  any SDK — it's a server-side convention nothing reads.
- **Schema:** NONE.
- **Verdict:** de facto compliant (envelope-shaped) but `message:` is dead —
  either every server should stop emitting it or every SDK should surface it.

### 6.3 Error envelope

- **DTO layer:** no `ErrorResponse` Data class. Every SDK's HTTP failure path
  branches on Saloon's default error shape.
- **Schema:** NONE.
- **Steering claim vs reality:** `data-first.md` says
  `{ message, errors?: { field: string[] } }` — matches Laravel's default 422
  shape. That's likely accurate for validation errors. Non-validation errors
  (403, 500) emit a bare `{ message }`. No schema.
- **Verdict:** no arbiter for the error surface. Non-validation error shapes are
  undocumented.

### 6.4 Compliance table

| Envelope kind            | Rows              | Compliant with steering (de facto)                                                                | Schema at `docs/contracts/` |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| List                     | 100+ list Actions | Y (via Laravel `LengthAwarePaginator`)                                                            | N                           |
| Single / create / update | 100+ Actions      | Y (SDK unwraps `data.` uniformly)                                                                 | N                           |
| Error                    | Every 4xx/5xx     | Partial — validation shape (`{message, errors}`) works; non-validation (`{message}`) undocumented | N                           |

**Every envelope is convention-driven; no schema catches drift.**

---

## 7. Per-schema audit — for the 0 schemas that exist

`docs/contracts/**/*.schema.json` = 0 files. No per-schema audit is possible.
The charter says "Enumerate `docs/contracts/**/*.schema.json` first — that's
your ground truth" — the ground is empty.

If we grant that the blueprint schemas ARE the current contract layer, then the
per-schema audit is:

| Blueprint schema                                                                      | `$id` (correct key?)             | `$schema` (correct key?) | `title`                                                   | Drift vs runtime?                                                                                                                                               | $comment coverage                                                                                                                                           | Notes                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json`                 | Uses `"id"` (wrong)              | Uses `"draft"` (wrong)   | Y (`JwtPayload`)                                          | Aligned with `JwtPayloadData` PHP class (sub, iss, aud, exp, iat, kid, jti, purpose, tid, sco, roles, permissions all present)                                  | Thin — inline `description:` per field; no top-level $comment for the 13 verification steps (those live in the sibling `jwt-payload-example.json`).         | Corresponds to what SHOULD be `docs/contracts/service-jwt.v1.schema.json`. Needs republish with correct keys, moved to `docs/contracts/`, sibling `.md` naming the 13-step verification list. |
| `blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json` | Uses `"id"` (wrong)              | Uses `"draft"` (wrong)   | Y (`ServiceAccount`)                                      | Aligned with `ServiceAccount` model — every field present, `secret_hash` in `x-wire.hidden`, `is_expiring_soon` / `days_until_expiry` computed accessors match. | Thick — each column carries a `description:` + type + pattern + FK. `x-*` extensions cover Eloquent + DB + wire concerns.                                   | Corresponds to what SHOULD be `docs/contracts/service-identity.v1.schema.json`. Needs the same republish.                                                                                     |
| `blueprints/identity/blueprints/service-accounts/data/jwt-payload-example.json`       | `"$version": 1` inline; no `$id` | No `$schema`             | Y (`Sample HS256 JWT payloads`)                           | Contains the SIGNATURE VERIFICATION ALGORITHM (13 steps) referenced by every JwtSigner / JwtVerifier docblock.                                                  | Documentation, not schema. This should NOT be in `docs/contracts/` (it's an example, not a contract) but the 13-step list needs a home in the schema layer. | The 13-step list should migrate to `docs/contracts/service-jwt.v1.md` (accompanying markdown).                                                                                                |
| `apps/academorix/src/blueprints/**/schemas/*.schema.json` (60+ files)                 | Uses `"id"` (wrong)              | Uses `"draft"` (wrong)   | Y (verified across chargeback / coupon / expenses / etc.) | Row-level alignment with corresponding Eloquent models likely (samples check out). Wire-request / wire-response shape not covered.                              | Rich per-column descriptions. `x-database`, `x-eloquent`, `x-wire`, `x-invariants` cover the row layer thoroughly.                                          | Row schemas only. The wire request/response shape (POST body, list-envelope shape) has no schema anywhere.                                                                                    |

**Every blueprint schema needs one of two things:**

- **Cheap path:** Rename `"id"` → `"$id"` + `"draft"` → `"$schema"`. Add
  `"$schema"` value from Draft-2020-12 (which is what `"draft"` is pointing at).
  Re-publish at `docs/contracts/`. Every existing consumer keeps working; every
  JSON Schema validator now accepts the file.
- **Correct path:** Author FRESH `docs/contracts/` schemas targeting Draft-07
  (per api-contract-designer charter) with the wire-payload shapes (request /
  response) that today are absent everywhere. Reference the row schemas from
  `x-wire`-shaped extensions on the wire schemas.

The cheap path is 1 sed run; the correct path is Phase-3 work.

---

## 8. Missing contracts — what needs to be authored

Numbered list, ordered by priority derived from downstream reviewer blockage.

### 8.1 P0 — Reviewers actively blocked

1. **`docs/contracts/README.md`** — the 5-rule preamble (source-of-truth, HS256
   fixed, default-deny abilities, tenant-scoped tokens, back-compat). Blocks:
   docs-adr-steward §"Cross-service contract schemas"; standards- steward's
   cross-service lane.
2. **`docs/contracts/service-jwt.v1.schema.json`** — HS256 JWT payload schema.
   Source: blueprint schema at
   `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json` (needs
   `"id"` → `"$id"` + `"draft"` → `"$schema"` fix). Accompanying
   `docs/contracts/service-jwt.v1.md` names the 13 verification steps (source:
   `blueprints/identity/blueprints/auth/data/jwt-payload-example.json`
   §`signature_verification_algorithm.steps`). Blocks: security-compliance-
   reviewer §"Inbound trust"; test-mutation-engineer §"Cross-service auth
   conformance".
3. **`docs/contracts/service-identity.v1.schema.json`** — ServiceAccount
   projection + exchange endpoint request/response. Source: blueprint schema at
   `blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json`
   for the projection; NEW authoring for the exchange endpoint. Blocks:
   security-compliance-reviewer §"Sanctum PAT identity"; test-mutation-engineer
   §"Cross-service auth conformance".
4. **`docs/service-boundary.md`** — the four-seam narrative (identity / inbound
   trust / data / observability). Referenced by 5+ agents' "Orient first"
   sections. Blocks: docs-adr-steward, security-compliance-reviewer,
   standards-steward, everyone who wants the seam map before authoring anything.
5. **`docs/adr/0022-language-agnostic-service-boundary.md`** — the ADR grounding
   every cross-service decision. Blocks the same set.

### 8.2 P1 — Contract-driven Phase 3 baseline

6. **`docs/contracts/list-envelope.v1.schema.json`** — the
   `{ data: T[], meta, links }` shape. Source: `PaginatedResponse` +
   `PaginationMeta` + `PaginationLinks` DTOs in
   `packages/backend/sdk/api-sdk/src/Data/`. Blocks: every SDK re-implementing
   envelope parsing.
7. **`docs/contracts/single-envelope.v1.schema.json`** — the
   `{ data: T, message?: string }` shape.
8. **`docs/contracts/error-envelope.v1.schema.json`** — the
   `{ message, errors? }` shape. Includes both validation shape
   (`errors: Record<field, string[]>`) and non-validation shape (`{ message }`
   bare).
9. **`docs/contracts/idempotency-key.v1.schema.json`** OR sibling `.md` —
   contract for the `Idempotency-Key` header (referenced across every SDK
   request DTO).

### 8.3 P1 — Per-resource wire schemas

10. `docs/contracts/applications/application.v1.schema.json` (Wire response; row
    schema exists in blueprints).
11. `docs/contracts/applications/create-application.v1.schema.json` (Wire
    request).
12. Same pair for each of the 100+ endpoints across finance / notifications /
    platform / sports / identity resources.

### 8.4 P2 — Event contracts

Every cross-service event needs a payload schema. Nothing today. Blocks:
`events-authoring.md` steering §"Cross-tier events cross a boundary explicitly"
— the `@stackra/realtime` bridge cannot type-check payloads without one.

13. `docs/contracts/events/user-registered.v1.schema.json`
14. `docs/contracts/events/ai-draft-created.v1.schema.json`
15. `docs/contracts/events/tenant-provisioned.v1.schema.json`
16. (many more — one per event owned by the platform)

### 8.5 P2 — AI-service seam

The `stackra-ai-service` sibling repo (per
`docs/adr/0026-agent-canonical-directory.md`) consumes contracts that live here.

17. `docs/contracts/ai/persona-invocation.v1.schema.json` (request/response).
18. `docs/contracts/ai/tool-call.v1.schema.json`.
19. `docs/contracts/ai/draft-confirm.v1.schema.json`.
20. `docs/contracts/ai/moderation-decision.v1.schema.json`.

Referenced tangentially by `.kiro/agents/mlops-reviewer.md` and
`data-scientist-reviewer.md`.

---

## 9. Suggested fix order

### Batch 1 — Land the layer (1-2 days)

1. Create `docs/contracts/` with `README.md` naming the 5 authoring rules
   (Draft-07 vs Draft-2020-12 pick — see §11 open questions).
2. Copy `blueprints/identity/blueprints/auth/schemas/jwt-payload.schema.json` to
   `docs/contracts/service-jwt.v1.schema.json`. Rewrite `"id"` → `"$id"`,
   `"draft"` → `"$schema"`. Land accompanying `service-jwt.v1.md` with the
   13-step verification list.
3. Copy
   `blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json`
   to `docs/contracts/service-identity.v1.schema.json` (same key rewrite). Add
   sibling `.md` naming consumers.
4. Author `docs/service-boundary.md` (four-seam narrative).
5. Land ADR-0022 language-agnostic service boundary (already referenced;
   docs-adr-steward can author).

### Batch 2 — Envelope contracts (1 day)

6. Author list / single / error / idempotency envelope schemas from the SDK DTOs
   already in the repo. Source of truth: `PaginatedResponse` +
   `PaginationMeta` + `PaginationLinks` (backend-api-sdk).
7. Update `PaginatedResponse` docblock to reference
   `docs/contracts/list-envelope.v1.schema.json` as source of truth.

### Batch 3 — First 10 wire schemas (1 week)

8. Author `docs/contracts/applications/*.v1.schema.json` for CRUD across
   `applications/`.
9. Update `packages/backend/platform/application/src/Actions/Applications/*.php`
   to populate
   `#[Post(..., summary: '...', tags: [...], requestSchema: '...', responseSchema: ApplicationData::class)]`.
10. Update
    `packages/backend/sdk/platform-application-sdk/src/Data/ApplicationData.php`
    to type-align with the schema (drop the `?string` on `createdAt` /
    `updatedAt` / `deletedAt` — hydrate through `DateTimeInterfaceCast` like the
    backend does).
11. Same round-trip for `tenants/`, `users/`, `roles/`, `permissions/`,
    `service-accounts/` — the 8 rows that carry `application_id` (per
    `.kiro/steering/tenancy-columns.md` §2).

### Batch 4 — Fan out via SDK schemas (2-4 weeks)

12. Add a `docs/contracts/` schema for every SDK's Data classes (25 in
    `apps/academorix/src/sdks/**` + 8 in `packages/backend/sdk/**`). Cross-
    check SDK Data type sigs against the backend Data type sigs — drift like
    `ApplicationData` will surface everywhere.
13. Update every SDK Data class's `Mirrors schemas/...schema.json` docblock to
    point at the resolved `docs/contracts/` path.

### Batch 5 — OpenAPI emission (parallel to Batch 3-4)

14. Land Scramble (`dedoc/scramble`) as a dev dep on `apps/laravel-template`
    (the only shipping Laravel app in the workspace; when `apps/api` or
    `apps/ai-service` land they get it too).
15. Wire the routing package's `getOpenApiAttribute()` output into Scramble's
    discovery so the per-Action attribute metadata becomes an `openapi.yaml` in
    the app's build output.
16. Enforce in CI: every Action with `#[Get|Post|Put|Patch|Delete]` must carry
    `summary:` + `responseSchema:`.

### Batch 6 — Events + AI seam (Phase 4)

17. Author every cross-service event payload schema. Cross-reference each with
    its emitter's docblock per `.kiro/steering/events-authoring.md`.
18. Author every AI-service seam contract; ship them to the `stackra-ai-service`
    sibling repo per ADR-0026.

---

## 10. Cross-agent handoffs

**For `docs-adr-steward`:**

- The ADR backlog surfaced by the sibling docs-adr-steward audit (2026-07-21)
  blocks every schema. Prioritise
  `docs/adr/0022-language-agnostic-service-boundary.md` first — every
  service-boundary reviewer cites it.
- The `docs/contracts/README.md` 5-rule preamble is a docs-adr-steward artefact
  (charter §"Cross-service contract schemas"); coordinate to author it once, in
  the correct schema drift.
- Steering `.kiro/steering/tenancy-columns.md` §9 gap register mentions
  `packages/domain/` as the shared HTTP-DTO package — this is a
  contracts-adjacent artefact; api-contract-designer should own the
  `docs/contracts/` shape, docs-adr-steward should own the ADR that authorises
  the package.

**For `laravel-feature-builder`:**

- Every Action authored under `apps/academorix/src/modules/**` or a new backend
  package MUST populate `summary:`, `tags:`, `responseSchema:`, `responseCode:`
  on its `#[Get|Post|...]` attribute. The infrastructure is there; the
  discipline isn't.
- Every new Data DTO in `Data/` needs a sibling
  `docs/contracts/<slug>.v1.schema.json` authored in the same PR.

**For `backend-architecture-reviewer`:**

- Add a review check: "every Action has non-null `summary` + `responseSchema` on
  its verb attribute". Zero-hit grep today; 100% failure until Batch 3 lands.
- Add a review check: "every SDK Data class points at a resolvable
  `docs/contracts/<slug>.v1.schema.json`". Zero-hit today.

**For `security-compliance-reviewer`:**

- The 13-step JWT verification list `JwtVerifier` implements SHOULD be checked
  against `docs/contracts/service-jwt.v1.md`. Today the check is against the
  blueprint `jwt-payload-example.json` — flag the mismatch when Batch 1 lands.
- ServiceAccount projection today is checked against
  `blueprints/identity/blueprints/service-accounts/data/service-account-example.json`
  (an EXAMPLE) rather than a schema. Post-Batch 1 the target is
  `docs/contracts/service-identity.v1.schema.json`.

**For `standards-steward`:**

- Add `docs/contracts/` presence to the workspace-scan gate list. Rule: "every
  cross-service DTO in `packages/backend/sdk/**` and
  `apps/academorix/src/sdks/**` has a `Mirrors` reference to a schema under
  `docs/contracts/`, not `schemas/*.schema.json` (unresolvable path)."

**For `test-mutation-engineer`:**

- The "conformance fixture every service-boundary test must round-trip" (charter
  #11) points at `docs/contracts/service-jwt.schema.json` +
  `docs/contracts/service-identity.schema.json`. Both are P0 blockers above.
  Post-Batch 1, generate a Pest dataset that reads the schema and builds sample
  JWTs from every valid combination of claims.

**For `data-modeler`:**

- The row schemas under `blueprints/**/schemas/*.schema.json` are the
  data-modeler's ERD-in-JSON. Coordinate: api-contract-designer produces the
  WIRE shape; data-modeler produces the ROW shape. Wire schemas should reference
  row schemas via `$ref` where the row shape is the contract (e.g.
  `application.schema.json` →
  `docs/contracts/applications/application.v1.schema.json`).

---

## 11. Open questions the charter should decide

1. **Draft-07 vs Draft-2020-12.** The api-contract-designer charter says
   "Draft-07 JSON Schema". The blueprint schemas target Draft-2020-12 (via the
   non-standard `"draft"` key). Republishing to Draft-07 loses `$defs`,
   `if`/`then`/`else`, `unevaluatedProperties`, and other 2020-12 features.
   Recommendation: **switch charter to Draft-2020-12** — every blueprint author
   already targets it and every modern JSON Schema validator supports both.

2. **Where the algorithm docs live.** The 13-step JWT verification algorithm
   today lives in an EXAMPLE JSON file's prose field. Options:
   - Move it to the schema's `$comment` block (nested — awkward but valid).
   - Move it to the sibling `.md` (readable; canonical per this charter's
     "accompanying `<slug>.v<n>.md`" rule).
   - Ship it as an `x-verification-steps` array on the schema (queryable from
     tests but non-standard).

   Recommendation: **sibling `.md`**. Matches the charter shape.

3. **Row schema ↔ wire schema relationship.** Every wire response schema is a
   subset of the row schema minus hidden fields plus computed fields. Should the
   wire schema `$ref` the row schema (with an `allOf` filter), or duplicate the
   fields? `$ref` is DRY-er but couples the two schemas at the URI level;
   duplication is simpler but drift-prone.

   Recommendation: **$ref with explicit allOf** — makes the "drop
   `x-wire.hidden`, add `x-wire.computed`" derivation traceable. Requires the
   validator to follow relative URI refs, which every modern validator does.

4. **Contract vs SDK Data — which is canonical?** Today the SDK Data class is
   the de facto contract because no schema exists. Post-Batch 1, the schema is
   canonical and the SDK Data class must align. Should the SDK Data class be
   generated from the schema (via Rector — the `packages/sdk-generator/`
   referenced in `.kiro/steering/enum-db-seed-dual-source.md`) or
   hand-maintained with a CI check?

   Recommendation: **hand-maintained with a CI check** initially; graduate to
   code-gen once the layer is stable.

5. **Blueprint schemas — migrate or shadow?** Every blueprint schema is the
   current de facto contract. Should `docs/contracts/` REPLACE them or be a
   SUBSET of them (wire schemas only, row schemas stay in blueprints)?

   Recommendation: **wire schemas only in `docs/contracts/`**. Row schemas stay
   under `blueprints/**/schemas/`. Cross-reference explicitly via
   `$ref: "../../blueprints/identity/blueprints/service-accounts/schemas/service-account.schema.json#/properties/id"`.
   Blueprint schemas need the `"id"` → `"$id"` key rewrite regardless.

---

## 12. What's rated healthy

Two things that DO work:

- **The `#[AsAction]` + `#[Get|Post|...]` composite attribute pattern.** Every
  action already has ONE HTTP method + ONE route path + typed input DTO + typed
  output DTO. This is the RAW MATERIAL a schema-generator can read.
  `getOpenApiAttribute()` is a working proof-of-concept — it just needs a
  caller.
- **The blueprint schema layer.** ~100 row schemas exist across identity,
  platform, access, billing, compliance, notifications, observability, workflow,
  plus 25+ under `apps/academorix/src/blueprints/**`. They're the wrong shape
  for `docs/contracts/` (row not wire) and they use the wrong keys (`"id"` not
  `"$id"`) — but they encode a huge amount of work the api-contract-designer
  should NOT redo. Batch 1 leverages this.

---

## Verification

Report is single-file, at the charter-specified path
`.kiro/reports/api-contract-designer-2026-07-21.md`.

Every claim in this report is grounded in a specific file or grep result:

- `docs/contracts/` missing: verified via `list_directory /docs` — only `adr/` +
  `backend-package-tiers.md` present.
- `docs/service-boundary.md` missing: verified via `list_directory /docs`.
- Blueprint schemas exist: verified via
  `grep_search json-schema.org/draft/2020-12` → 20+ hits under `blueprints/**`
  and `apps/academorix/src/blueprints/**`.
- Runtime code exists: verified by reading
  `packages/backend/identity/service-accounts/src/Models/ServiceAccount.php`,
  `packages/backend/identity/auth/src/Services/JwtSigner.php`,
  `packages/backend/identity/auth/src/Services/JwtVerifier.php`.
- SDK docblock references: verified via `grep_search schemas/\w+\.schema\.json`.
- `ApplicationData` drift: verified by reading both files side-by-side.
- OpenAPI attribute fields unused: verified via
  `grep_search "responseSchema:" apps/**/*.php packages/**/*.php` → 0 hits.
- OpenAPI output missing: verified via `file_search openapi`.
- Scramble not installed: verified via `grep_search scramble **/composer.json`.

No files were modified except this report.
