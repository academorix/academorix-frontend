# Cross-service contracts

**Anchor:** [ADR-0022](../adr/0022-language-agnostic-service-boundary.md).

Every wire shape that crosses a service boundary lives here as JSON Schema
(draft 2020-12). This directory is the SOURCE OF TRUTH for the boundary; every
implementation (`packages/backend/*`, `packages/domain/*`,
`stackra-ai/packages/security/`, `packages/frontend/http/`) is generated or
hand-derived from these files.

## The five rules

Every schema in this directory follows the same discipline.

### Rule 1 — Schemas are the source of truth

Language bindings (PHP DTOs, Python dataclasses, TypeScript interfaces, future
Go structs) are GENERATED from these schemas — never hand-copied. Divergence
between a schema and any binding is a bug in the binding, not the schema.

### Rule 2 — Signature scheme is fixed

Every service-to-service JWT uses **HS256** over a **>=32-byte Doppler secret**.
The receiver refuses to boot on a weak / short / missing secret. Changing the
algorithm (to RS256 / ES256) is a BREAKING change — a new schema version + a
coordinated rollout across every consumer.

### Rule 3 — Default-deny abilities

Every service PAT (`docs/contracts/service-identity.v1.schema.json`) carries an
explicit `abilities` array. Empty array = no permissions. There is no "wildcard"
ability. Every action a service performs on Laravel's HTTP surface maps to a
documented ability string.

### Rule 4 — Every cross-service token is tenant-scoped

Every service JWT payload carries a non-empty `tenant_id` claim. Verification
step 11 rejects tokens with missing or empty `tenant_id`. Central-plane admin
operations use a distinct `platform-admin` PAT with `tenant_id: null` in the
identity envelope, and NEVER use the Seam 2 JWT path.

### Rule 5 — Backward-compatibility discipline

Contract change matrix:

| Change                              | Bump  | Coordination                                    |
| ----------------------------------- | ----- | ----------------------------------------------- |
| Add an optional field               | patch | none — safe                                     |
| Add a new optional enum value       | patch | none — safe                                     |
| Widen a numeric range               | patch | none — safe                                     |
| Rename a field                      | major | coordinated PR across every language binding    |
| Remove a field                      | major | coordinated PR + old-schema deprecation window  |
| Tighten a constraint (regex, range) | major | coordinated PR across every language binding    |
| Change a field type                 | major | coordinated PR + old-schema deprecation window  |
| Change signature algorithm          | major | new ADR + coordinated PR + old-schema retention |

Bump the version in the schema's `$id` (`.v1.schema.json` → `.v2.schema.json`)
and keep the old file until every consumer has migrated. The old file gets a
`"deprecated": true` marker + a `"deprecatedReason"` pointing at the successor.

## Current schemas

| Schema                            | Seam | Owner                                        | Notes                                                                       |
| --------------------------------- | :--: | -------------------------------------------- | --------------------------------------------------------------------------- |
| `service-identity.v1.schema.json` |  1   | `packages/backend/identity/service-accounts` | Sanctum PAT + `ServiceAccount` projection. Consumed by every service.       |
| `service-jwt.v1.schema.json`      |  2   | `packages/backend/identity/auth`             | HS256 JWT payload. Companion: `service-jwt.v1.md` for the 13-step verifier. |
| `list-envelope.v1.schema.json`    |  3   | every HTTP surface                           | `{data: [...], meta: {...}, links: {...}}`                                  |
| `single-envelope.v1.schema.json`  |  3   | every HTTP surface                           | `{data: {...}, message?: string}`                                           |
| `error-envelope.v1.schema.json`   |  3   | every HTTP surface                           | `{message, errors?: {field: [msg, ...]}}`                                   |

## Adding a new schema

Copy-paste checklist:

- [ ] Pick a stable slug (kebab-case).
- [ ] Version starts at `.v1.schema.json`.
- [ ] Include `$schema` (draft 2020-12), `$id` (public URL), `title`,
      `description`.
- [ ] Include a top-level `$comment` block naming the seam, the producer, and
      every consumer.
- [ ] Every field carries a `description`.
- [ ] Every enum lists its members exhaustively.
- [ ] Every optional field is documented as optional.
- [ ] Every constraint (regex, format, range) is documented in a `$comment`
      block when the reason isn't obvious.
- [ ] Add the schema row to the "Current schemas" table above.
- [ ] If the schema names a new seam, update `docs/service-boundary.md`.
- [ ] If the schema codifies a decision, land an ADR alongside.

## Coordinating a change

The coordinated-rollout choreography for a MAJOR bump:

1. **Author the new schema** at the bumped `$id` (`.v2.schema.json`).
2. **Leave the old schema** in place with a `"deprecated": true` marker +
   `"deprecatedReason"` pointing at the successor.
3. **Ship the new bindings** in every language repo, coordinated through a
   single PR per repo referencing the same schema change.
4. **Cut over consumers** one deploy at a time — each service updates its client
   to the new schema, verifies in staging, promotes to production.
5. **Remove the old schema** after every consumer has migrated AND at least one
   full deprecation window (60 days minimum) has elapsed.

Never delete an old schema without confirming every consumer has migrated. Grep
every downstream repo for the old schema slug before removing.

## Cross-references

- [ADR-0022](../adr/0022-language-agnostic-service-boundary.md) — the
  language-agnostic boundary this directory codifies.
- [ADR-0032](../adr/0032-six-service-split.md) — the six-service split (Option
  B) whose service edges these contracts sit on.
- [ADR-0033](../adr/0033-cross-service-authentication-contract.md) — the
  cross-service authentication contract (user JWT via `Authorization: Bearer`
  - machine JWT via `X-Service-Identity`) that these schemas implement.
- [`docs/services.md`](../services.md) — the operational contract for the
  six-service topology (ownership map, deployment, dev bootstrap).
- [`docs/service-boundary.md`](../service-boundary.md) — the narrative
  walkthrough of the four seams.
- [`.kiro/steering/service-boundary.md`](../../.kiro/steering/service-boundary.md)
  — the day-to-day rule set.
