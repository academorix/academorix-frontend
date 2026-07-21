<?php

declare(strict_types=1);

namespace Stackra\Crud\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedInclude;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * Generic Eloquent-backed repository providing typed CRUD out of the box.
 *
 * Concrete repositories extend this class, declare their model via {@see Model()}
 * and optionally the request-driven allow-lists ({@see allowedFilters()},
 * {@see allowedSorts()}, {@see allowedIncludes()}). Domain-specific finders are
 * added as public methods that build on the protected {@see query()} helper.
 *
 * We use explicit, typed methods (with PHPDoc generics) rather than a `__call`
 * proxy so PHPStan and the IDE can see the full API.
 *
 * @template TModel of Model
 *
 * @implements RepositoryInterface<TModel>
 *
 * @mixin Builder<TModel>
 */
abstract class BaseRepository implements RepositoryInterface
{
    /**
     * The fully-qualified model class this repository manages.
     *
     * Public to match the {@see RepositoryInterface::model()} visibility —
     * concrete implementations must expose this so consumers can reach
     * the model class through the repository seam without a static call.
     *
     * @return class-string<TModel>
     */
    abstract public function model(): string;

    /**
     * Filters a client may apply via `?filter[...]` (empty = none allowed).
     *
     * @return array<int, AllowedFilter|string>
     */
    protected function allowedFilters(): array
    {
        return [];
    }

    /**
     * Sorts a client may apply via `?sort=` (empty = none allowed).
     *
     * @return array<int, AllowedSort|string>
     */
    protected function allowedSorts(): array
    {
        return [];
    }

    /**
     * Relations a client may eager-load via `?include=` (empty = none allowed).
     *
     * @return array<int, AllowedInclude|string>
     */
    protected function allowedIncludes(): array
    {
        return [];
    }

    /**
     * Default sort applied when the request specifies none.
     */
    protected function defaultSort(): string
    {
        return '-created_at';
    }

    /**
     * A fresh Eloquent query for the managed model.
     *
     * @return Builder<TModel>
     */
    protected function query(): Builder
    {
        // larastan cannot carry the generic TModel through a class-string
        // ::query() call because Builder's template parameter is invariant; the
        // runtime type is nonetheless correct, so this assertion is safe.
        /** @var Builder<TModel> $query */
        $query = $this->model()::query(); // @phpstan-ignore varTag.type

        return $query;
    }

    /**
     * A request-driven query with this repository's allow-lists applied.
     *
     * Filtering/sorting/including is read from the current request by
     * spatie/laravel-query-builder; anything not explicitly allowed throws an
     * exception rather than leaking query power to the client.
     *
     * @return QueryBuilder<TModel>
     */
    protected function apiQuery(): QueryBuilder
    {
        /** @var QueryBuilder<TModel> $query */
        $query = QueryBuilder::for($this->model())
            ->allowedFilters(...$this->allowedFilters())
            ->allowedSorts(...$this->allowedSorts())
            ->allowedIncludes(...$this->allowedIncludes())
            ->defaultSort($this->defaultSort());

        return $query;
    }

    /** {@inheritDoc} */
    public function create(array $attributes): Model
    {
        return $this->query()->create($attributes);
    }

    /** {@inheritDoc} */
    public function find(int|string $id, array $columns = ['*']): ?Model
    {
        return $this->query()->find($id, $columns);
    }

    /** {@inheritDoc} */
    public function findOrFail(int|string $id, array $columns = ['*']): Model
    {
        return $this->query()->findOrFail($id, $columns);
    }

    /** {@inheritDoc} */
    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);
        $model->fill($attributes);
        $model->save();

        return $model->refresh();
    }

    /** {@inheritDoc} */
    public function delete(int|string $id): bool
    {
        $model = $this->findOrFail($id);

        return (bool) $model->delete();
    }

    /**
     * {@inheritDoc}
     *
     * @return LengthAwarePaginator<int, TModel>
     */
    public function paginate(?int $perPage = null, array $columns = ['*']): LengthAwarePaginator
    {
        // Match the interface's nullable-perPage signature; a null value
        // defers to Eloquent's per-model default (usually 15).
        return $this->apiQuery()
            ->paginate($perPage ?? 15, $columns)
            ->appends(request()->query());
    }

    /**
     * {@inheritDoc}
     *
     * The interface declares an `Illuminate\Support\Collection` return type;
     * `Illuminate\Database\Eloquent\Collection` extends it, so this narrower
     * type is a valid covariant override at the runtime level. Matches the
     * interface's `array $columns = ['*']` parameter to avoid PHP's LSP
     * signature-compatibility warning at class-load time.
     *
     * @return Collection<int, TModel>
     */
    public function all(array $columns = ['*']): \Illuminate\Support\Collection
    {
        // Same limitation as query(): larastan cannot carry TModel through the
        // invariant builder/collection generic, so it widens to the base model.
        return $this->query()->get($columns); // @phpstan-ignore return.type
    }

    // =========================================================================
    // Model Access — additional interface surface
    // =========================================================================

    /**
     * {@inheritDoc}
     */
    public function getEntityName(): string
    {
        return \strtolower(\class_basename($this->model()));
    }

    /**
     * {@inheritDoc}
     *
     * @return Builder<TModel>
     */
    public function newQuery(): Builder
    {
        return $this->query();
    }

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory<TModel>
     */
    public function factory(): \Illuminate\Database\Eloquent\Factories\Factory
    {
        $modelClass = $this->model();

        if (! \method_exists($modelClass, 'factory')) {
            throw new \RuntimeException(\sprintf(
                'Model %s does not expose a factory().',
                $modelClass,
            ));
        }

        /** @var \Illuminate\Database\Eloquent\Factories\Factory<TModel> $factory */
        $factory = $modelClass::factory(); // @phpstan-ignore staticMethod.notFound

        return $factory;
    }

    // =========================================================================
    // Read Operations — additional interface surface
    // =========================================================================

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Support\Collection<int, TModel>
     */
    public function findByField(string $field, mixed $value, array $columns = ['*']): \Illuminate\Support\Collection
    {
        return $this->query()->where($field, $value)->get($columns);
    }

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Support\Collection<int, TModel>
     */
    public function findWhere(array $conditions, array $columns = ['*']): \Illuminate\Support\Collection
    {
        return $this->query()->where($conditions)->get($columns);
    }

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Support\Collection<int, TModel>
     */
    public function findWhereIn(string $field, array $values, array $columns = ['*']): \Illuminate\Support\Collection
    {
        return $this->query()->whereIn($field, $values)->get($columns);
    }

    /** {@inheritDoc} */
    public function first(array $columns = ['*']): ?Model
    {
        return $this->query()->first($columns);
    }

    /** {@inheritDoc} */
    public function firstOrFail(array $columns = ['*']): Model
    {
        return $this->query()->firstOrFail($columns);
    }

    /** {@inheritDoc} */
    public function firstOrCreate(array $attributes): Model
    {
        return $this->query()->firstOrCreate($attributes);
    }

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Support\Collection<int|string, mixed>
     */
    public function pluck(string $column, ?string $key = null): \Illuminate\Support\Collection
    {
        return $this->query()->pluck($column, $key);
    }

    /** {@inheritDoc} */
    public function count(array $conditions = []): int
    {
        $query = $this->query();

        if ($conditions !== []) {
            $query = $query->where($conditions);
        }

        return $query->count();
    }

    /** {@inheritDoc} */
    public function exists(int|string $id): bool
    {
        return $this->query()->whereKey($id)->exists();
    }

    // =========================================================================
    // Write Operations — additional interface surface
    // =========================================================================

    /** {@inheritDoc} */
    public function updateOrCreate(array $attributes, array $values = []): Model
    {
        return $this->query()->updateOrCreate($attributes, $values);
    }

    /** {@inheritDoc} */
    public function deleteWhere(array $conditions): int
    {
        return $this->query()->where($conditions)->delete();
    }

    // =========================================================================
    // Pagination — additional interface surface
    // =========================================================================

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Contracts\Pagination\Paginator
     */
    public function simplePaginate(?int $perPage = null, array $columns = ['*']): \Illuminate\Contracts\Pagination\Paginator
    {
        return $this->apiQuery()
            ->simplePaginate($perPage ?? 15, $columns)
            ->appends(request()->query());
    }

    // =========================================================================
    // Criteria — minimal in-memory stack
    // =========================================================================

    /**
     * Pushed criteria applied by every read query.
     *
     * The stack is per-instance so tests can build one repository, push a
     * scoping criteria, and expect subsequent reads to honour it without
     * touching global state.
     *
     * @var array<int, \Stackra\Crud\Contracts\CriteriaInterface>
     */
    protected array $criteria = [];

    /**
     * When `true`, {@see query()} skips applied criteria for the next call.
     */
    protected bool $skipCriteria = false;

    /**
     * Optional scope closure applied on top of the query.
     *
     * @var (\Closure(Builder<TModel>): Builder<TModel>)|null
     */
    protected ?\Closure $scopeQuery = null;

    /** {@inheritDoc} */
    public function pushCriteria(\Stackra\Crud\Contracts\CriteriaInterface $criteria): static
    {
        $this->criteria[] = $criteria;

        return $this;
    }

    /** {@inheritDoc} */
    public function popCriteria(string $criteriaClass): static
    {
        $this->criteria = \array_values(\array_filter(
            $this->criteria,
            static fn (\Stackra\Crud\Contracts\CriteriaInterface $c): bool => ! ($c instanceof $criteriaClass),
        ));

        return $this;
    }

    /** {@inheritDoc} */
    public function resetCriteria(): static
    {
        $this->criteria = [];

        return $this;
    }

    /** {@inheritDoc} */
    public function skipCriteria(bool $skip = true): static
    {
        $this->skipCriteria = $skip;

        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * @return \Illuminate\Support\Collection<int, \Stackra\Crud\Contracts\CriteriaInterface>
     */
    public function getCriteria(): \Illuminate\Support\Collection
    {
        return \collect($this->criteria);
    }

    // =========================================================================
    // Query Modifiers — additional interface surface
    // =========================================================================

    /** {@inheritDoc} */
    public function scopeQuery(\Closure $scope): static
    {
        $this->scopeQuery = $scope;

        return $this;
    }

    /** {@inheritDoc} */
    public function resetScope(): static
    {
        $this->scopeQuery = null;

        return $this;
    }

    /** {@inheritDoc} */
    public function with(array|string $relations): static
    {
        $this->scopeQuery = static function (Builder $q) use ($relations): Builder {
            return $q->with($relations);
        };

        return $this;
    }

    /** {@inheritDoc} */
    public function withCount(array|string $relations): static
    {
        $this->scopeQuery = static function (Builder $q) use ($relations): Builder {
            return $q->withCount($relations);
        };

        return $this;
    }

    /** {@inheritDoc} */
    public function orderBy(string $column, string $direction = 'asc'): static
    {
        $this->scopeQuery = static function (Builder $q) use ($column, $direction): Builder {
            return $q->orderBy($column, $direction);
        };

        return $this;
    }

    // =========================================================================
    // Request Filtering & Sorting — passthroughs
    // =========================================================================

    /**
     * {@inheritDoc}
     *
     * Passthrough — the concrete `apiQuery()` chain already applies
     * `spatie/laravel-query-builder` filters. Subclasses that need eager
     * filtering can override this method to apply attribute-driven filters.
     */
    public function filter(): static
    {
        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * Passthrough — request-driven sorting is applied by `apiQuery()` via
     * spatie/laravel-query-builder. Override in subclasses that need
     * attribute-driven sort application.
     */
    public function sort(): static
    {
        return $this;
    }

    /**
     * {@inheritDoc}
     *
     * Passthrough — override in subclasses that need attribute-driven
     * search application. Not implemented at the base level because a
     * useful default requires knowing which fields are searchable.
     */
    public function search(): static
    {
        return $this;
    }

    // =========================================================================
    // Dynamic call proxy
    // =========================================================================

    /**
     * Proxy undefined method calls to a fresh query builder for the model.
     *
     * Enables ad-hoc query methods (`where`, `firstWhere`, `orderBy`, …) through
     * the repository. The {@see Builder} mixin keeps them statically analysable.
     *
     * @param  string  $name  The called method name.
     * @param  array<int, mixed>  $arguments  The call arguments.
     */
    public function __call(string $name, array $arguments): mixed
    {
        return $this->query()->{$name}(...$arguments); // @phpstan-ignore method.dynamicName
    }
}
