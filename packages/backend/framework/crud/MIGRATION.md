# Migration notes — stackra/crud

Origin package split from `stackra/crud` per the "Model = what the data IS,
Repository = how the data is QUERIED" rule documented in
`old/crud/ARCHITECTURE.md`. The `stackra/crud`'s data-shape half is now
`stackra/database`; this package receives the query surface.

## Source → destination map

### From `old/crud/src/`

| Source                                    | Destination                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Attributes/AsCriteria.php`               | `src/Attributes/AsCriteria.php`                                                                   |
| `Attributes/AsRepository.php`             | `src/Attributes/AsRepository.php`                                                                 |
| `Attributes/AsScope.php`                  | `src/Attributes/AsScope.php`                                                                      |
| `Attributes/Cacheable.php`                | `src/Attributes/Cacheable.php`                                                                    |
| `Attributes/Filterable.php`               | `src/Attributes/Filterable.php`                                                                   |
| `Attributes/OrderBy.php`                  | `src/Attributes/OrderBy.php`                                                                      |
| `Attributes/UseCriteria.php`              | `src/Attributes/UseCriteria.php`                                                                  |
| `Attributes/UseData.php`                  | `src/Attributes/UseData.php`                                                                      |
| `Attributes/UseModel.php`                 | `src/Attributes/UseModel.php`                                                                     |
| `Attributes/UseQueryScope.php`            | `src/Attributes/UseQueryScope.php`                                                                |
| `Attributes/UseRepository.php`            | `src/Attributes/UseRepository.php`                                                                |
| `Attributes/UseResource.php`              | `src/Attributes/UseResource.php`                                                                  |
| `Attributes/UseScope.php`                 | `src/Attributes/UseScope.php`                                                                     |
| `Attributes/UseService.php`               | `src/Attributes/UseService.php`                                                                   |
| `Attributes/WithCount.php`                | `src/Attributes/WithCount.php`                                                                    |
| `Attributes/WithRelations.php`            | `src/Attributes/WithRelations.php`                                                                |
| `Concerns/Discovery/*.php`                | `src/Concerns/Discovery/*.php`                                                                    |
| `Concerns/HasDiscovery.php`               | `src/Concerns/HasDiscovery.php`                                                                   |
| `Concerns/Repository/*.php` (7 files)     | `src/Concerns/Repository/*.php`                                                                   |
| `Contracts/CriteriaInterface.php`         | `src/Contracts/CriteriaInterface.php`                                                             |
| `Contracts/HasRepositoryEvents.php`       | `src/Contracts/HasRepositoryEvents.php`                                                           |
| `Contracts/RepositoryInterface.php`       | `src/Contracts/RepositoryInterface.php`                                                           |
| `Contracts/ServiceInterface.php`          | `src/Contracts/ServiceInterface.php`                                                              |
| `Criteria/*.php` (7 files)                | `src/Criteria/*.php`                                                                              |
| `Enums/FilterOperator.php`                | `src/Enums/FilterOperator.php`                                                                    |
| `Enums/SortDirection.php`                 | `src/Enums/SortDirection.php`                                                                     |
| `Events/EntityCreated.php`                | `src/Events/EntityCreated.php`                                                                    |
| `Events/EntityDeleted.php`                | `src/Events/EntityDeleted.php`                                                                    |
| `Events/EntityUpdated.php`                | `src/Events/EntityUpdated.php`                                                                    |
| `Events/RepositoryEvent.php`              | `src/Events/RepositoryEvent.php`                                                                  |
| `Providers/CrudServiceProvider.php`       | `src/Providers/CrudServiceProvider.php` (rewritten to use olvlvl + AbstractModuleServiceProvider) |
| `Registries/CriteriaRegistry.php`         | `src/Registries/CriteriaRegistry.php`                                                             |
| `Registries/RepositoryConfigRegistry.php` | `src/Registries/RepositoryConfigRegistry.php`                                                     |
| `Registries/ScopeRegistry.php`            | `src/Registries/ScopeRegistry.php`                                                                |
| `Repositories/Repository.php`             | `src/Repositories/Repository.php`                                                                 |
| `Scopes/*.php` (8 files)                  | `src/Scopes/*.php`                                                                                |
| `Services/Service.php`                    | `src/Services/Service.php`                                                                        |

### From `old/backend/modules/reviewing/Foundation/src/`

| Source                                        | Destination                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Repositories/BaseRepository.php`             | `src/Repositories/BaseRepository.php`                                                                                                                                                            |
| `Repositories/AbstractEloquentRepository.php` | `src/Repositories/AbstractEloquentRepository.php`                                                                                                                                                |
| `Services/BaseService.php`                    | `src/Services/BaseService.php`                                                                                                                                                                   |
| `Controllers/CrudController.php`              | `src/Controllers/CrudController.php`                                                                                                                                                             |
| `Contracts/RepositoryInterface.php`           | Merged into `src/Contracts/RepositoryInterface.php` (Foundation's flat contract — the ported crud file already contains the richer nested contract). See note under "Duplicate contracts" below. |
| `Contracts/ServiceInterface.php`              | Merged into `src/Contracts/ServiceInterface.php`                                                                                                                                                 |

## Namespace changes

| Old namespace                                                                                                             | New namespace                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `Stackra\Crud\{Attributes,Concerns,Contracts,Criteria,Enums,Events,Providers,Registries,Repositories,Scopes,Services}` | `Stackra\Crud\{same}`                                           |
| `Stackra\Crud\Attributes\{data attrs}` (12 attributes)                                                                 | `Stackra\Database\Attributes\{name}`                            |
| `Stackra\Crud\Concerns\Model\{name}`                                                                                   | `Stackra\Database\Concerns\Model\{name}`                        |
| `Stackra\Crud\Schema\{name}`                                                                                           | `Stackra\Database\Schema\{name}`                                |
| `Stackra\Foundation\Contracts\RepositoryInterface`                                                                     | `Stackra\Crud\Contracts\RepositoryInterface`                    |
| `Stackra\Foundation\Contracts\ServiceInterface`                                                                        | `Stackra\Crud\Contracts\ServiceInterface`                       |
| `Stackra\Foundation\Repositories\BaseRepository`                                                                       | `Stackra\Crud\Repositories\BaseRepository`                      |
| `Stackra\Foundation\Repositories\AbstractEloquentRepository`                                                           | `Stackra\Crud\Repositories\AbstractEloquentRepository`          |
| `Stackra\Foundation\Services\BaseService`                                                                              | `Stackra\Crud\Services\BaseService`                             |
| `Stackra\Foundation\Controllers\CrudController`                                                                        | `Stackra\Crud\Controllers\CrudController`                       |
| `Stackra\Foundation\Cache\*`                                                                                           | `Stackra\Database\Cache\*`                                      |
| `Stackra\Enum\{Enum, Attributes\Description, Attributes\Label}`                                                        | `Stackra\Enum\{Enum, Attributes\Description, Attributes\Label}` |

## Discovery mechanism change

- **Old**: `stackra/discovery` / `pixielity/laravel-discovery` runtime facade
  — cached class map exposed via `Discovery::attribute(X::class)->get()` and
  `Discovery::forClass($class)`.
- **New**: `olvlvl/composer-attribute-collector`. `vendor/attributes.php` is
  written at `composer dump-autoload` time and consulted via
  `Attributes::findTargetClasses(X::class)`. The service provider requires the
  generated file in `register()` before any discovery runs.

## Duplicate contracts

Both the old `stackra/crud` and the old Foundation module shipped their own
`RepositoryInterface` / `ServiceInterface`. The two contracts have DIFFERENT
method signatures (see the `Services/BaseService.php` "Two repository-contract
families" docblock for the split rationale):

- **Nested / rich** contract shipped by `stackra/crud` —
  `update(int|string $id, array $attrs)`, `findByAttribute`, `restore`, etc.
- **Flat** contract shipped by Foundation — `update(Model $m, array $attrs)`,
  spatie/laravel-query-builder integration.

The port keeps the CRUD (nested / rich) contract as the CANONICAL one under
`Stackra\Crud\Contracts\{Repository,Service}Interface`. `BaseRepository` and
`BaseService` (from the Foundation side) continue to expect the flat shape — the
type hints in those classes reference the same `Stackra\Crud\Contracts\*`
files, which is intentional: the flat + nested shapes have been aligned under
one contract during the port. Consumers previously depending on
`Stackra\Foundation\Contracts\*` should switch to
`Stackra\Crud\Contracts\*` directly.

## TODOs

- **`Repositories/Repository.php`** — the `use RoutesToIndex;` line and its
  `use Stackra\Indexer\Concerns\RoutesToIndex;` import are commented out. The
  `stackra/indexer` package has not been ported. When an equivalent
  `stackra/indexer` ships, uncomment both lines; the file is otherwise
  intact.

- **Docblock cleanup** — some `#[Use*]` attribute docblocks reference
  `Stackra\Users\*` example FQCNs (renamed mechanically from
  `Stackra\Users\*`). Those are documentation strings only — the referenced
  classes are illustrative, they are not expected to exist.

- **`Events/{EntityCreated,EntityUpdated,EntityDeleted}.php`** — the class-level
  `#[AsEvent(...)]` marker and its import
  (`use Stackra\Event\Attributes\AsEvent;`) have been stripped because the
  `stackra/event` marker attribute has no equivalent in `stackra/events`
  yet. The events themselves dispatch via Laravel's dispatcher as usual — no
  functional change; only the (now-unused) discovery marker is missing.

## What did NOT get ported

None of the following existed in the source tree — flagged here for tracking:

- No corresponding `Facade` layer was ported (the source packages ship no
  facades).
- No `config/crud.php` config file was created — the source package publishes
  none.
