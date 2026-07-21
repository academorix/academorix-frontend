# stackra/scope

Framework-tier hierarchical scope platform. Provides the substrate every
configuration-owning module builds on — settings, permissions, feature flags,
pricing, notifications preferences, and so on.

## Why it exists

A SaaS multi-tenant app needs to answer questions like "what is the value of
`invoice.prefix` for **this** request?" — where the answer might come from a
user preference, a branch override, a tenant default, or a global fallback.
Hardcoding a fixed hierarchy per feature (settings has `system → tenant → user`,
permissions has `system → tenant → team`, pricing has `system → plan → tenant`)
fractures the platform:

- Every feature reinvents hierarchy + resolution + cache + context propagation.
- Scopes stop being comparable — the "tenant" a setting sees may not equal the
  "tenant" a permission sees.
- Front-end has to consume N different scope shapes.
- Cross-feature ops like "impersonate this scope everywhere" are impossible.

This package centralises the mechanics so every consumer sees the same
resolution semantics.

## Model

Four tables. Every consumer registers a namespace and stores values against
nodes.

```
scope_definitions  → what levels EXIST per owner (per-tenant configurable
                      hierarchy: MNGO uses global→owner→region→venue,
                      Stackra uses global→owner→academy→team)
scope_nodes        → concrete instances mapped to real entity ids, carrying
                      a materialised_path column for O(1) ancestor traversal
scope_values       → key-value store, namespaced by consumer, JSONB payload
scope_aliases      → owner-specific display renames ("tenant" → "organisation")
```

Adding a new hierarchy level for a specific deployment is a `scope_definitions`
insert — zero code, zero migration.

## Consumer registration

Every framework/domain package that owns configuration registers a namespace in
its own service provider's boot:

```php
public function boot(ScopeRegistryInterface $scope): void
{
    $scope->consumer('settings', new ScopeConsumerConfig(
        defaultValueFactory: fn (string $key) => null,
        validator: fn (mixed $value) => is_scalar($value) || is_array($value),
    ));
}
```

Reads at runtime:

```php
$value = Scope::resolve('settings', 'invoice.prefix');   // walks up the tree
$node  = Scope::current();                                // active scope node
Scope::runIn($otherNode, fn () => /* code here sees a different scope */);
```

## Request-side wiring

`ResolveScope` middleware attaches to `/api/v1/...` routes and runs the resolver
chain (`Header → JWT → TenantContext → RootFallback`) to establish
`ScopeContext::current()` for the request. Downstream services (Eloquent
auto-scoping, cache tag derivation, DataLoaders) read that context without
threading it through every call.

## Auto-scoped models

Any Eloquent model whose table carries a `scope_node_id` column can opt in with
`#[ScopedTo]`:

```php
#[ScopedTo]
final class Invoice extends Model { ... }
```

Every query gets an implicit
`WHERE scope_node_id IN (<ancestor chain of current node>)`. Admins can opt out
per method with `#[BypassScope(reason: 'audit report')]`.

## Non-goals

- **Not** a settings storage engine — that's `stackra/settings`, which is a
  consumer.
- **Not** an ACL — that's `stackra/authorization`, also a consumer.
- **Not** a tenancy resolver — that's `stackra-api/tenancy`. Scope only knows
  about `scope_nodes`; the tenancy module wires its Tenant row → scope node.
