---
inclusion: fileMatch
fileMatchPattern: "**/Actions/**/*.php"
---

# Actions-only architecture (ADR 0016 expanded)

Every endpoint in every domain module ships as ONE class — the Action. No
Services layer, no Controllers layer, no `CrudController` base. Read this before
authoring anything under `Actions/`.

## Precedence

1. This steering wins over any generic controller/service pattern.
   `.kiro/steering/domain-patterns.md` predates ADR 0016 — the ADR + this file
   supersede its Controller / Service sections.
2. `docs/adr/0016-actions-only-no-services-no-controllers.md` is the ADR; this
   file is the how-to for authoring.
3. When a domain has genuine cross-action orchestration (resolvers, contexts,
   long-running workers) the class lives in `Services/` — see "Support/ vs
   Services/" below. **Registries live in `Registry/`**, never in `Services/` —
   see `.kiro/steering/folder-conventions.md` for the locked per-folder table.

## Location

Actions live in `<module>/src/Actions/<BoundedContext>/`. Private per-action
collaborators (multi-write orchestrators, computed views, notification emitters)
live in `<module>/src/Actions/Support/`. Cross-action orchestrators (resolvers,
contexts) live in `<module>/src/Services/`. Registries live in
`<module>/src/Registry/`.

See `.kiro/steering/folder-conventions.md` for the full per-folder ownership
table — it enumerates which primitive owns which folder and lists the
anti-patterns (registries in `Services/`, VOs in `Registry/`, bootstrappers in
`Concerns/`, etc.).

## Actions folder shape

```
src/Actions/
├── <BoundedContext1>/          — CRUD + lifecycle endpoints for one aggregate
│   ├── Create<Noun>.php
│   ├── Update<Noun>.php
│   ├── Delete<Noun>.php
│   ├── Show<Noun>.php
│   └── List<Noun>s.php
├── <BoundedContext2>/
│   └── ...
└── Support/                    — private per-action collaborators
    └── Compute<X>.php
```

Concrete example (tenancy module):

```
src/Actions/
├── Tenants/
│   ├── CreateTenant.php
│   ├── UpdateTenant.php
│   ├── DeleteTenant.php
│   ├── ShowTenant.php
│   ├── ListTenants.php
│   ├── ActivateTenant.php
│   ├── DeactivateTenant.php
│   ├── SuspendTenant.php
│   ├── ScheduleTenantDeletion.php
│   └── CancelTenantDeletion.php
├── Domains/
│   ├── AddTenantDomain.php
│   ├── RemoveTenantDomain.php
│   ├── VerifyTenantDomain.php
│   ├── SetTenantPrimaryDomain.php
│   ├── ShowTenantDomain.php
│   └── ListTenantDomains.php
├── Memberships/
│   ├── InviteTenantMembership.php
│   ├── RemoveTenantMembership.php
│   └── ListTenantMemberships.php
└── Support/
    ├── ComputeOnboardingProgress.php
    ├── ProvisionTenant.php
    └── RecordMembershipActivity.php
```

## Naming

- **FULL class names.** `CreateTenant`, not `Create` inside `Tenants/`. Grep
  clarity, PHPStan diagnostics clarity, stack trace clarity — all three break
  when the class name relies on its folder for context.
- **Namespace mirrors folder.**
  `Academorix\Tenancy\Actions\Tenants\CreateTenant`.
- **Route name derived from `#[AsAction(name: '...')]`.** Dot-separated,
  lowercase, singular unless the noun is intrinsically plural (a "list"
  endpoint):
  - `tenants.create`, `tenants.update`, `tenants.show`, `tenants.list` (list
    endpoint plural noun)
  - `tenants.activate`, `tenants.suspend`
  - `tenants.domains.add`, `tenants.domains.verify`
  - `tenants.memberships.invite`

## One-level nesting only

`Actions/Tenants/Draft/CreateDraftTenant.php` is forbidden. Two paths for
"sub-flows":

1. **Shared internal logic** → extract to `Actions/Support/`.
   `ComputeDraftPreview.php` inside `Support/` is reachable from every Action in
   the same module but never exposed as its own endpoint.
2. **A whole new bounded context** → sibling folder.
   `Actions/Drafts/CreateDraft.php` — a first-class bounded context with its own
   aggregate.

The "one-level" rule keeps the endpoint surface flat and grep-friendly.
`find src/Actions -name '*.php' -maxdepth 3` returns every endpoint the module
owns.

## `Support/` vs `Services/`

Two different concepts. Never conflate:

### `Support/` — private per-action collaborators

- Lives at `src/Actions/Support/`.
- No route attribute. Never an endpoint.
- Constructor + one public method (`__invoke` OR a domain verb like
  `compute()`).
- Reachable ONLY from Actions in the **same** module. Never from another module.
- Common shapes:
  - Multi-write orchestrators (`ProvisionTenant` — chains 4 repository writes).
  - Computed views (`ComputeOnboardingProgress` — folds tenant state +
    membership state + branding state into a DTO).
  - Notification emitters (`NotifyUserOfWorkspaces` — dispatches a queued Mail
    with a structured payload).

### `Services/` — genuine cross-action orchestrators

- Lives at `src/Services/`.
- Legitimate uses only:
  - Registries (`PersonaRegistry`, `ToolRegistry`) — populated by discovery,
    consumed by many Actions.
  - Resolvers (`TenantResolver`, `TenantContext`) — one instance per request,
    injected everywhere.
  - Contexts / stateful helpers (`BootstrapContext`, `TenantGuardHandle`) —
    scoped state carriers.
  - Long-running background workers (`AttendanceSync`, `ReportPipeline`) —
    invoked from a queue.
- **NEVER a CRUD wrapper.** `TenantService::create(...)`,
  `TenantService::find(...)` are banned. The Action IS the create; the
  repository IS the find.
- The PHPStan rule `architecture.no_service_layer` flags any
  `Services/*Service.php` file that shadows a CRUD Action in the same module.
  Read the rule's error message before adding a new `Services/` file.

## Action anatomy

```php
<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Tenants;

use Academorix\Access\Attributes\RequirePermission;
use Academorix\Access\Enums\TenancyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Data\Requests\CreateTenantRequestData;
use Academorix\Tenancy\Data\Resources\TenantResourceData;

/**
 * `POST /api/v1/tenants` — create a new tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
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

Line-by-line contract:

- `final class` — actions are leaves. No `extends`.
- `#[AsAction(name: '...')]` — the marker attribute. Picked up by the Routing
  package's discovery.
- ONE HTTP verb attribute (`#[Get]` / `#[Post]` / `#[Put]` / `#[Patch]` /
  `#[Delete]`) — an action serves exactly one route.
- `#[Middleware([...])]` — authentication + generic middleware.
- Authorization attribute (`#[RequirePermission]` / `#[RequireRole]` /
  `#[AllowGuest]`) — fires before route-model-binding.
- `use AsController;` trait — brings the `InteractsWith*` helpers (response
  building, pagination, data transformation, bulk ops).
- ONE `__invoke()` method — the router treats invokable classes as single-method
  targets natively.
- Input DTO — Spatie `Data` class. Auto-hydrated + validated.
- Return type — a Spatie `Data` class (rendered to JSON by the response builder)
  OR `Illuminate\Http\Response` when a bespoke status / header matters.

## Constructor DI

Repositories + framework services via attribute-first DI:

```php
public function __construct(
    private readonly TenantRepositoryInterface $tenants,
    private readonly DomainRepositoryInterface $domains,

    #[Cache('redis')]           private readonly Repository $cache,
    #[Log('tenancy')]           private readonly LoggerInterface $log,
    #[Config('tenancy.default_business_type')] private readonly string $defaultBusinessType,
    #[DB('central')]            private readonly Connection $db,
    #[CurrentUser]              private readonly User $user,
) {}
```

- Repository / registry / support-class deps → plain typed parameter. The
  container resolves via `#[Bind]` on the interface.
- Framework services → constructor-attribute injection (`#[Cache]`, `#[Log]`,
  `#[Config]`, `#[DB]`, `#[Auth]`, `#[CurrentUser]`, `#[Storage]`).
- Never `app()` / `resolve()` / `Facade::` calls inside the action body. Every
  dep is a constructor parameter — the action reads like a dependency manifest.

## Anti-patterns

| Anti-pattern                                                       | Preferred                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Transaction-script sprawl inside `__invoke` (5+ writes)            | Extract to `Support/Provision<Aggregate>.php`; the action calls the collaborator.                              |
| `Services/TenantService.php` wrapping every repo method            | Delete. The Action is the endpoint; the repository is the persistence boundary. No CRUD wrapper layer.         |
| `class ShowTenant extends BaseController`                          | `final class ShowTenant` + `use AsController;` — no base class inheritance.                                    |
| Method injection on `__invoke` (`$request->has(...)` inside)       | Constructor DI + typed `Data` DTO on `__invoke`. Laravel resolves method-args but constructor is the manifest. |
| Two HTTP verb attributes on one action                             | Split into two actions. Route-to-action is 1:1.                                                                |
| Sub-sub-directory nesting (`Actions/Tenants/Draft/...`)            | One-level nesting. Use `Support/` or a sibling bounded context.                                                |
| Action delegating to `TenantService::create($data)`                | Action calls `$this->tenants->create(...)` directly. Repository is the seam.                                   |
| Inline role checks (`if (! $user->hasRole('admin')) abort(403)`)   | `#[RequireRole('admin')]` — the middleware fires before route-model-binding.                                   |
| Grouped resource controllers with 5 actions                        | 5 invokable single-action classes. One file per endpoint.                                                      |
| Reading `request()` inside the action body                         | Type-hint the input DTO; Spatie hydrates from the request.                                                     |
| Returning `->json([...])` arrays                                   | Return a typed `Data` class. The response builder renders it consistently.                                     |
| A `Services/PermissionService.php` that just paginates permissions | Direct repository call from the Action. Delete the service.                                                    |

## Testing

Two flavours per action:

- **Feature test** — hits the endpoint through the router:

  ```php
  it('creates a tenant', function () {
      $user = User::factory()->withPermission(TenancyPermission::Manage)->create();

      $response = $this->actingAs($user)
          ->postJson('/api/v1/tenants', [
              'name' => 'Acme Sports Club',
              'slug' => 'acme-sports-club',
              'business_type' => BusinessTypeEnum::SportsCenter->value,
          ]);

      $response->assertCreated();
      expect(Tenant::query()->count())->toBe(1);
  });
  ```

- **Unit test** — invokes the action class through the container:

  ```php
  it('creates a tenant via the action directly', function () {
      $tenants = Mockery::mock(TenantRepositoryInterface::class);
      $tenants->shouldReceive('create')->once()->andReturn($fake = Tenant::factory()->make());

      $action = new CreateTenant($tenants);
      $result = $action(CreateTenantRequestData::from([/* ... */]));

      expect($result)->toBeInstanceOf(TenantResourceData::class);
  });
  ```

Both flavours are cheap because the action is one class. No service seam to
mock, no controller-to-service handoff to duplicate.
