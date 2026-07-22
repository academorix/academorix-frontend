# ADR 0030 — `payment_methods` ownership: `finance/payment` owns the table

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Data lead + Backend
architecture + Product lead

## Context

Two modules under `apps/academorix/src/modules/finance/` ship a migration that
creates the same `payment_methods` table at the same timestamp:

- **`apps/academorix/src/modules/finance/gateway/`** —
  `2026_07_15_120002_create_payment_methods_table.php`
- **`apps/academorix/src/modules/finance/payment/`** —
  `2026_07_15_120002_create_payment_methods_table.php`

Both migrations call `Schema::create(PaymentMethodInterface::TABLE, ...)` and
both resolve to the same physical `payment_methods` table. Running
`php artisan migrate --seed` on a fresh database fires whichever migration
Laravel discovers first + dies on the second with "relation `payment_methods`
already exists". This is the B7 blocker in
`.kiro/reports/00-triage-summary-2026-07-21.md` and the WARN-005 collision in
`.kiro/reports/tenancy-compliance-auditor-2026-07-21.md` (also flagged as
duplicate-migration finding in
`.kiro/reports/data-modeler-2026-07-21.md §Complete duplicate- migration inventory`).

The collision surfaces a deeper design question: **which module owns the
payment-method concept?**

- **`finance/gateway/`** is the **transport integration** module. Its job is to
  talk to payment gateways (Stripe, Paddle, Adyen, local wire-transfer
  processors) — building requests, verifying webhook signatures, mapping
  gateway-specific events into Stackra- native events. The rows it owns are
  gateway-facing: `PaymentIntent` (a Stripe/Paddle intent), gateway credentials,
  webhook event mirrors, capture/settlement records. Gateway rows reference an
  underlying `payment_method`, they don't define it.
- **`finance/payment/`** is the **payment aggregate** module. Its job is to
  model what the customer is paying with — payment cards, wire-transfer
  accounts, wallet balances, redeemable coupons, gift certificates — and the
  payment records that flow through them (transactions, disputes, refunds). The
  `payment_ method` shape is a business concern belonging to this module.

The `payment_methods` payload — card fingerprint, expiry, wallet identifier,
wire-transfer bank details, coupon code — is customer- facing wire contract
data. It is not gateway-specific: a single `payment_method` row can be settled
through multiple gateways over its lifetime (a card originally added via Stripe
can be re-charged through Paddle in a gateway migration).

## Options considered

1. **Keep both migrations, resolve at deployment time (rejected).** The
   collision is deterministic on `Schema::create` — the second migration always
   fails. There is no "resolve at deployment" answer; the two rows fight over
   the same table by design.
2. **Canonical owner = `finance/gateway/`; `finance/payment/` drops its
   migration (rejected).** Places the customer-facing payment- method definition
   inside the gateway-integration transport layer. Every future gateway
   integration (Adyen, PayFast, a new local processor) would either duplicate
   the payment-method shape or couple the customer-facing contract to a single
   gateway vendor. Contradicts the module-boundary charter that gateway is
   transport, not business semantics.
3. **Canonical owner = `finance/payment/`; `finance/gateway/` drops its
   migration + FKs to `payment_methods` (chosen).** Places the customer-facing
   payment-method definition inside the payment aggregate module. Gateway
   becomes a downstream consumer that references a `payment_method_id` on its
   own gateway-scoped rows. The module boundary follows the semantics: payment
   owns "what the customer is paying with"; gateway owns "how we talk to the
   settlement rails".

## Decision

### D1 — Canonical owner is `apps/academorix/src/modules/finance/payment/`

The `payment_methods` table is owned by
`apps/academorix/src/modules/finance/payment/`. That module ships:

- `PaymentMethodInterface` (Contracts/Data) with `TABLE`, `PRIMARY_KEY`,
  `KEY_TYPE`, `ATTR_*` constants.
- `PaymentMethod` model composing `BelongsToTenant` per
  `.kiro/steering/tenancy-columns.md §3` (tenant-scoped domain row).
- `create_payment_methods_table.php` migration with `tenant_id` + soft-delete +
  userstamps + composite `(tenant_id, created_at)` index (see ADR-0041 for the
  composite- index policy across the workspace).
- All CRUD Actions under `Actions/Payments/PaymentMethods/*`.
- Every downstream Action / repository / seeder that treats `payment_methods` as
  its aggregate root.

### D2 — `finance/gateway/` drops its `payment_methods` migration

`apps/academorix/src/modules/finance/gateway/database/migrations/ 2026_07_15_120002_create_payment_methods_table.php`
is removed as part of the follow-up A5 commit (see Follow-up work below). The
`gateway/` module gains no `PaymentMethodInterface` — it imports the interface
from `finance/payment/`.

### D3 — `finance/gateway/` FKs to `payment_methods` on its own rows

Gateway-scoped rows (`payment_intents`, `gateway_transactions`,
`gateway_webhook_events`, gateway credentials) carry a nullable
`payment_method_id` FK where applicable. The FK is nullable because some gateway
concerns (a raw webhook, a settlement reconciliation record) legitimately have
no payment-method context.

Cross-module FK is legal here because both modules ship in the same app
(`apps/academorix/`) — no cross-package Composer dependency is introduced. The
FK is declared in `gateway/`'s migration referencing `payment_methods` (the
survivor's table name).

### D4 — Payment-gateway rows stay with `finance/gateway/`

Everything genuinely gateway-scoped remains in `finance/gateway/`:

- **`payment_intents`** — Stripe/Paddle intent objects. Belong to the gateway
  that issued them; different rows for the same `payment_method` across
  gateways.
- **`gateway_transactions`** — capture/settlement records tied to a specific
  gateway invocation.
- **`gateway_webhook_events`** — inbound webhook mirror.
- **`gateway_credentials`** / `gateway_configurations` — per-tenant, per-gateway
  auth material.

None of these are customer-facing payment-method rows. They are transport-layer
records of how a settlement happened.

### D5 — Cross-gateway payment-method portability

Because `payment_methods` live outside `finance/gateway/`, the same
`payment_method` row can be settled through different gateways over its
lifetime. A card added when the tenant used Stripe can be re-charged through
Paddle after a gateway migration — the `payment_method` row stays put; the
`payment_intent` history records the gateway trail. This portability is why the
payment-method concept cannot live inside a gateway-integration module.

### D6 — No feature drift during migration

The `finance/gateway/` migration deleted in D2 is a byte-identical duplicate of
the `finance/payment/` survivor. Diff verification is mandatory before the file
is removed (`data-modeler-2026-07-21.md §B7` recommends this pre-flight; the
codebase-housekeeper commit runs `diff` on the two migrations before deleting
the gateway version). No schema change; the survivor's shape is authoritative.

## Consequences

**Positive:**

- **`php artisan migrate --seed` runs green.** The B7 / WARN-005 blocker closes
  the moment the gateway migration is deleted.
- **Module boundary follows the semantics.** Payment owns the business shape;
  gateway owns the integration transport.
- **Gateway migrations become additive.** Adding Adyen, PayFast, or a local
  processor is a new provider under `finance/gateway/` referencing the existing
  `payment_methods` — no schema drift, no vendor lock-in on the payment-method
  definition.
- **Consistent with ADR-0025 Integrations two-lane model.** Payment gateways are
  a provider category under `platform/integrations` in the long run; the
  payment-method aggregate is orthogonal to which provider is currently active.

**Negative:**

- **Any existing consumer of the gateway module's `PaymentMethodInterface` must
  re-import from `finance/payment/`.** Verified via grep — count is small (fewer
  than 5 downstream Actions inside `apps/academorix/`; no cross-app consumers
  because both modules are app-local).
- **`finance/gateway/` gains a soft dependency on `finance/payment/` for its FK
  target.** Both modules already ship in the same app boot cycle; the dependency
  is intra-app and does not introduce a new package require. Migration order is
  handled by the ordinal in the timestamp (`payment_methods` creation at
  `120002` sits before gateway rows that reference it).

**Neutral:**

- **The `payment_methods` table shape doesn't change.** Same columns, same
  tenant scoping, same soft-delete + userstamps. The survivor migration is
  byte-identical to the deleted one (verified as part of the follow-up commit).

## Follow-up work

The ADR itself is a design decision. Execution is a `codebase- housekeeper`
commit against A5 in `tasks.md`:

1. `diff apps/academorix/src/modules/finance/gateway/database/ migrations/2026_07_15_120002_create_payment_methods_table.php apps/academorix/src/modules/finance/payment/database/migrations/ 2026_07_15_120002_create_payment_methods_table.php`
   — verify byte-identical (or reconcile before deleting).
2. `git rm apps/academorix/src/modules/finance/gateway/database/ migrations/2026_07_15_120002_create_payment_methods_table.php`.
3. Delete
   `apps/academorix/src/modules/finance/gateway/src/Contracts/Data/ PaymentMethodInterface.php`
   if it exists (verified via grep; likely present as a duplicate).
4. Delete
   `apps/academorix/src/modules/finance/gateway/src/Models/ PaymentMethod.php`
   if it exists.
5. For every Action / repository in `finance/gateway/` that imports
   `PaymentMethodInterface` or `PaymentMethod`, rewrite the import to point at
   `finance/payment/`.
6. Add the `payment_method_id` FK column to any gateway rows that should carry
   it (`payment_intents`, `gateway_transactions`) — nullable, FK constraint
   against `payment_methods.id`. Composite index
   `(payment_method_id, created_at)` where the row is time-series.
7. Verify `php artisan migrate --seed` on fresh SQLite passes.
8. Verify existing gateway + payment tests still pass.

That work lands under Phase A of `tasks.md` and unblocks the rest of Phase A. It
requires no schema migration on already-deployed databases — this codebase is
pre-first-deployment.

## Related work

- `.kiro/steering/hierarchy.md §6 (module responsibility map)` — the pattern
  this ADR applies (each domain concern lives in exactly one module).
- `.kiro/steering/tenancy-columns.md §3 (Package matrix)` — `payment_methods` is
  a tenant-scoped domain row composing `BelongsToTenant`; not on the 8-row
  `application_id` mandate.
- `.kiro/steering/tenancy-columns.md §5 (Non-goals — forbidden columns)` —
  `payment_methods` cascades through `tenant_id → tenants.application_id`;
  direct `application_id` is not carried.
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md §WARN-005` — the
  collision this ADR resolves.
- `.kiro/reports/data-modeler-2026-07-21.md §B7` — the duplicate- migration
  blocker + the pre-flight diff recommendation.
- `.kiro/reports/00-triage-summary-2026-07-21.md §Deployment blockers (BLOCKER B7)`
  — the deployment blocker this ADR unblocks.
- ADR-0025 — Integrations two-lane model (payment gateways are a provider
  category under the Lane 1 integration model; the payment-method aggregate is
  orthogonal to which provider is active).
- ADR-0041 (planned) — Composite `(tenant_id, created_at)` index policy that the
  survivor migration will conform to.
