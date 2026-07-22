# ADR 0016 — Actions-only; no services layer, no controllers layer

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture +
Delivery lead

## Context

The pre-ADR layout adopted a classic Laravel four-layer stack — `Controllers/` →
`Services/` → `Repositories/` → `Models/`. In practice every CRUD endpoint
traced the same path five times: `IndexController::index()` calls
`TenantService::list($data)` which calls `$this->tenants->paginate($data)` which
calls `Tenant::query()->paginate()`. Three files, two seams, zero business logic
between them.

Across the ~90 backend packages that shape adds up:

- **Ceremony ratio.** For every "unique" domain rule (an authorization check, a
  policy hook, a validation quirk) there were 4-6 files (`Controller`,
  `Service`, `ServiceInterface`, `Repository`, `RepositoryInterface`, `Data`)
  that carried no logic of their own but had to be present because the tier
  above required the tier below.
- **Duplicate CRUD wrappers.** `TenantService::find(...)`,
  `BranchService::find(...)`, `OrganizationService::find(...)` — 90 identical
  bodies delegating to a repository method one line away.
- **Non-obvious ownership.** "Where does the validation live?" split between the
  `Data` class + the `Service` + the model observer. "Where does the
  authorization live?" split between the `Middleware` + the `Controller` + the
  `Service` early-return.
- **Tests doubled.** Every endpoint had a feature test AND a service unit test
  that mocked the repository. The service was so thin that the two tests
  asserted the same thing twice.

The industry pattern that fixes this — used by
[`lorisleiva/laravel-actions`](https://laravelactions.com), Django's class-based
views, ASP.NET Minimal APIs — collapses the three tiers into **one class per
endpoint**: the Action. One class contains the routing attribute, the
authorization attribute, the input DTO type-hint, and the `__invoke()` body that
calls the repository directly. No wrapper service, no `Controllers/` folder
shadowing the `Actions/` folder.

## Options considered

1. **Keep the 4-tier stack.** Familiar to every Laravel dev, matches the docs.
   Rejected — the ceremony is real; every reviewer round-tripped between the
   same 4 files to reason about one endpoint.

2. **Actions + Services (hybrid — Actions for one-shot writes, Services for
   reads).** Rejected — the boundary is judgment-based ("is this a one-shot
   write or a query?") and drifts. Every reviewer's answer diverged.

3. **Actions-only (chosen).** Every HTTP endpoint is a single-invoke Action.
   `Services/` is reserved for genuine cross-action orchestrators (resolvers,
   contexts, long-running workers) — never a CRUD wrapper. `Controllers/`
   disappears entirely. `Repositories/` remain as the Eloquent seam.

## Decision

Every backend HTTP endpoint in every module ships as **ONE** class — the Action.
The shape:

```php
#[AsAction(name: 'tenants.create')]
#[Post('/api/v1/tenants')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission(TenancyPermission::Manage)]
final class CreateTenant
{
    use AsController;

    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {}

    public function __invoke(CreateTenantRequestData $data): TenantResourceData
    {
        $tenant = $this->tenants->create($data->toArray());

        return TenantResourceData::from($tenant);
    }
}
```

### D1 — The `Actions/` folder is the only endpoint home

Every module's `src/Actions/<BoundedContext>/` folder holds the endpoints that
context owns. Filename mirrors class name mirrors namespace segment
(`Actions/Tenants/CreateTenant.php` →
`Stackra\Tenancy\Actions\Tenants\CreateTenant`).

### D2 — `Controllers/` folder is banned in domain modules

No `Controllers/` folder exists in any `packages/backend/<domain>/` package.
Extending `Illuminate\Routing\Controller` is banned in domain code. The
`AsController` trait from `Stackra\Routing\Concerns` supplies the
`InteractsWith*` helpers (response building, pagination, data transformation,
bulk ops) that legitimate controllers used to inherit.

### D3 — `Services/` folder is reserved for genuine orchestrators

`Services/` in a domain module is legitimate ONLY for:

- **Registries** (`PersonaRegistry`, `ToolRegistry`) — hydrated by discovery.
- **Resolvers** (`TenantResolver`, `TenantContext`) — request-scoped state.
- **Long-running workers** (`AttendanceSync`, `ReportPipeline`) — queue-invoked.

`Services/*CrudService.php` classes wrapping every repo method are banned.
Actions call `$this->tenants->create(...)` directly.

### D4 — `Support/` folder holds private per-action collaborators

Multi-write orchestrators (`ProvisionTenant` — chains 4 repo writes), computed
views (`ComputeOnboardingProgress`), notification emitters
(`NotifyUserOfWorkspaces`) live in `Actions/Support/`. They have no route, no
HTTP surface, and are reachable ONLY from Actions in the same module.

### D5 — One HTTP verb per Action, one Action per route

An Action carries EXACTLY one of `#[Get]` / `#[Post]` / `#[Put]` / `#[Patch]` /
`#[Delete]`. Route-to-action is 1:1. Grouped resource controllers with 5 actions
become 5 invokable single-action classes.

## Consequences

**Positive:**

- **One file per endpoint.** Grep-friendly, review-friendly, IDE-friendly. The
  Action IS the endpoint.
- **Ceremony down to what's necessary.** Repository + Action + Data. No wrapper
  service that adds a line and takes another.
- **Testability up.** Feature test hits the router; unit test invokes the Action
  class directly. Both are cheap because there's no service seam to mock.
- **Authorization declarative.** `#[RequirePermission]` / `#[RequireRole]` fires
  before route-model-binding. No inline role checks.

**Negative:**

- **1,959 Action files** in the codebase as of 2026-07-21.
  `find src/Actions -name '*.php'` at any single package is manageable, but the
  workspace total is large. Mitigated by the flat one-level nesting rule
  (ADR-0043 — Actions folder flatten policy).
- **The name "Actions" collides** with `lorisleiva/laravel-actions` on first
  read. We don't use that vendor package — our Actions are plain final classes
  with an `AsController` trait. Every builder learns this once.
- **Legacy migration cost.** Pre-2026 code carries `Controllers/` + `Services/`
  in a handful of packages. Phase E of the compliance sweep migrates them one
  package at a time.

**Neutral:**

- **`Repositories/` remain unchanged.** The Eloquent seam is preserved; every
  Action injects the repository contract and calls it directly.
- **Two architecture rules enforce the mandate at CI time**, under
  `packages/backend/compliance/architecture/`:
  - **`NoBaseControllerRule.php`** — rejects any domain-module class that
    extends `Illuminate\Routing\Controller` (or a `CrudController` /
    `ApiController` base). Domain endpoints use the `AsController` trait; they
    never extend a Controller class.
  - **`NoServiceLayerRule.php`** — flags any `Services/*Service.php` file that
    shadows a CRUD Action in the same module (i.e. wraps `list`, `find`,
    `create`, `update`, `delete` on a repository without adding orchestration).

## Related work

- `.kiro/steering/actions-only-full.md` — the day-to-day authoring rules
  (naming, folder shape, anti-patterns, testing) this ADR codifies.
- `.kiro/steering/domain-patterns.md` §Actions — the per-file contract.
- `.kiro/steering/package-architecture.md` §Locked folder table — the canonical
  `src/` layout every package converges on.
- `.kiro/steering/folder-conventions.md` — the per-folder ownership table
  (`Registry/` never in `Services/`, `Support/` never a registry, etc.).
- ADR-0040 — CrudController deletion (removes the last non-Action HTTP base).
- ADR-0043 — Actions folder flatten policy (one-level nesting rule).

Supersedes: ADR-0013 (multi-layer controller pattern — deprecated by this ADR).
