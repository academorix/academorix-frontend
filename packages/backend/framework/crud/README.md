# academorix/crud

Attribute-driven repository layer for every Academorix module. Answers **"how
the data is QUERIED and MANAGED"** — pair with `academorix/database` for **"what
the data IS"**.

> **Services removed per ADR 0016.** The `Services/*` classes (`BaseService`,
> `Service`), the `ServiceInterface` contract, and the `#[UseService]` +
> `#[UseRepository]` attributes were deleted in Phase 1 of the tenancy + access
> modernization sweep. **Actions absorb business logic; the repository is the
> persistence boundary.** See
> [`.kiro/steering/actions-only-full.md`](../../../.kiro/steering/actions-only-full.md)
> for the full authoring contract and
> [`docs/adr/0016-actions-only-no-services-no-controllers.md`](../../../docs/adr/0016-actions-only-no-services-no-controllers.md)
> for the decision record. `CrudController` and its `Concerns/Controller/*`
> traits are retained for the migration window but marked `@deprecated`; they
> will be deleted in the Phase 9 access-module rewrite.

## Package layout

```
src/
├── Attributes/                 — query attributes (repository-side only)
│   ├── AsCriteria.php
│   ├── AsRepository.php
│   ├── AsScope.php
│   ├── Cacheable.php
│   ├── Filterable.php
│   ├── OrderBy.php
│   ├── UseCriteria.php
│   ├── UseData.php
│   ├── UseModel.php
│   ├── UseQueryScope.php
│   ├── UseResource.php
│   ├── UseScope.php
│   ├── WithCount.php
│   └── WithRelations.php
├── Compiler/                   — TODO: pending academorix/compiler port
│   ├── CriteriaRegistryCompiler.php
│   ├── RepositoryConfigCompiler.php
│   └── ScopeRegistryCompiler.php
├── Concerns/
│   ├── Discovery/              — olvlvl-based attribute discovery
│   │   ├── HasDiscoverableCriteria.php
│   │   ├── HasDiscoverableRepositories.php
│   │   └── HasDiscoverableScopes.php
│   ├── HasDiscovery.php        — composite trait bootstrapping the three above
│   └── Repository/             — repository-side cross-cutting behaviours
│       ├── BootsFromRegistry.php
│       ├── HasCriteria.php
│       ├── HasEvents.php
│       ├── HasQueryModifiers.php
│       ├── HasRequestFiltering.php
│       ├── HasTranslatable.php
│       └── PreparesQueries.php
├── Contracts/
│   ├── CriteriaInterface.php
│   ├── HasRepositoryEvents.php
│   └── RepositoryInterface.php
├── Controllers/
│   └── CrudController.php      — @deprecated; deleted in Phase 9 (ADR 0016)
├── Criteria/                   — reusable request-shaped query filters
│   ├── MetadataCriteria.php
│   ├── OrderByCriteria.php
│   ├── RequestFilterCriteria.php
│   ├── RequestSearchCriteria.php
│   ├── RequestSortCriteria.php
│   ├── TranslatableCriteria.php
│   └── WhereCriteria.php
├── Enums/
│   ├── FilterOperator.php
│   └── SortDirection.php
├── Events/                     — repository lifecycle events
│   ├── EntityCreated.php
│   ├── EntityDeleted.php
│   ├── EntityUpdated.php
│   └── RepositoryEvent.php
├── Providers/
│   └── CrudServiceProvider.php
├── Registries/                 — boot-time attribute-resolved config
│   ├── CriteriaRegistry.php
│   ├── RepositoryConfigRegistry.php
│   └── ScopeRegistry.php
├── Repositories/
│   ├── AbstractEloquentRepository.php  — tenant-scoped cache + attribute lookups
│   ├── BaseRepository.php               — spatie/laravel-query-builder integration
│   └── Repository.php                   — attribute-driven repository base
└── Scopes/                     — reusable global scopes
    ├── ActiveScope.php
    ├── ExcludeDeletedScope.php
    ├── FeaturedScope.php
    ├── OfTypeScope.php
    ├── PublishedScope.php
    ├── RecentScope.php
    ├── TenantScope.php
    └── VerifiedScope.php
```

_`Services/` directory removed per ADR 0016 (Phase 1). Actions absorb business
logic; the repository is the persistence boundary._

## Public API

### Attribute surface

Class-level, all discovered at `composer dump-autoload` time:

- `#[AsRepository]` — repository marker
- `#[AsCriteria(name: '…')]` — criterion marker
- `#[AsScope(name: '…')]` — global-scope marker
- `#[UseModel(ProductInterface::class)]`
- `#[UseResource(ProductResource::class)]`
- `#[UseData(ProductData::class)]`
- `#[UseCriteria(ActiveCriteria::class)]` — repeatable
- `#[UseScope(ActiveScope::class)]` — repeatable
- `#[UseQueryScope('published')]` — repeatable
- `#[Filterable([...])]` — allow-list config for request-driven filters
- `#[OrderBy(column: 'created_at', direction: 'desc')]` — repeatable
- `#[WithRelations('category', 'tags')]` — repeatable
- `#[WithCount('reviews')]` — repeatable
- `#[Cacheable(ttl: 3600)]`

_`#[UseRepository]` and `#[UseService]` removed per ADR 0016 (Phase 1). Actions
inject their repository via constructor DI on the interface directly — no
attribute indirection needed._

### Main classes

- `Repository` — attribute-driven repository base class. Reads its config from
  the pre-resolved `RepositoryConfigRegistry`. Zero runtime reflection under
  Octane.
- `AbstractEloquentRepository<T>` — tenant-scoped, cache-tag aware repository
  base for models with a companion `<X>Interface` shipping `ATTR_*` + `TABLE`
  constants.
- `BaseRepository<T>` — spatie/laravel-query-builder base for request-driven
  filter/sort/include allow-lists.
- `CrudController<T>` — **@deprecated per ADR 0016.** Retained for the migration
  window; deleted in Phase 9. New endpoints ship as Actions per
  [`.kiro/steering/actions-only-full.md`](../../../.kiro/steering/actions-only-full.md).

## Quick start

### 1. Install

```bash
composer require academorix/crud
```

The service provider is auto-discovered — nothing to add to
`bootstrap/providers.php`.

### 2. Author a repository

```php
namespace Academorix\Products\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\OrderBy;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Attributes\UseScope;
use Academorix\Crud\Attributes\WithCount;
use Academorix\Crud\Attributes\WithRelations;
use Academorix\Crud\Repositories\Repository;
use Academorix\Crud\Scopes\ActiveScope;
use Academorix\Products\Contracts\Data\ProductInterface;

#[AsRepository]
#[UseModel(ProductInterface::class)]
#[WithRelations('category', 'tags')]
#[WithCount('reviews')]
#[OrderBy(column: 'created_at', direction: 'desc')]
#[Filterable(['name' => ['$eq', '$contains'], 'price' => '*'])]
#[UseScope(ActiveScope::class)]
final class ProductRepository extends Repository
{
    public function findFeatured(): \Illuminate\Support\Collection
    {
        return $this->query()->where('is_featured', true)->get();
    }
}
```

### 3. Author an endpoint (Action)

Endpoints ship as single-invocation Action classes per ADR 0016 — no Service
layer, no Controller. The repository is the persistence boundary; the Action
orchestrates the request → response cycle.

```php
namespace Academorix\Products\Actions\Products;

use Academorix\Access\Attributes\RequirePermission;
use Academorix\Products\Contracts\ProductRepositoryInterface;
use Academorix\Products\Data\PublishProductRequestData;
use Academorix\Products\Data\ProductData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Patch;

#[AsAction(name: 'products.publish')]
#[Patch('/api/v1/products/{product}/publish')]
#[RequirePermission('products.manage')]
final class PublishProduct
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
    ) {}

    public function __invoke(PublishProductRequestData $data): ProductData
    {
        $product = $this->products->update($data->productId, [
            'published_at' => now(),
        ]);

        return ProductData::from($product);
    }
}
```

See
[`.kiro/steering/actions-only-full.md`](../../../.kiro/steering/actions-only-full.md)
for the full authoring contract (folder layout, naming rules, `Support/` vs
`Services/` split, transaction-script boundaries).

## Discovery flow

```
composer dump-autoload
  └── olvlvl/composer-attribute-collector scans the autoload map,
      writes vendor/attributes.php with every attribute target.

Application boot
  └── CrudServiceProvider::registerBespoke()
        └── require vendor/attributes.php
  └── CrudServiceProvider::bootBespoke()
        └── $this->app->booted(fn () =>
              $this->discoverCriteria()
                → CriteriaRegistry
              $this->discoverScopes()
                → ScopeRegistry
              $this->discoverRepositories()
                → RepositoryConfigRegistry (pre-resolves per-repo
                  attribute stack: WithRelations, WithCount,
                  OrderBy, Filterable, UseCriteria, UseScope,
                  UseQueryScope, plus Sortable/Searchable/
                  Translatable read from the model side))

Repository::__construct
  └── loadConfigFromRegistry()  — O(1) hash lookup, no reflection
```

## Related

- Data-shape counterpart: `academorix/database`
- Service-provider base: `academorix/foundation`
- Attribute discovery runtime: `olvlvl/composer-attribute-collector`

## Testing

```bash
pnpm turbo run test --filter=@academorix/crud
```
