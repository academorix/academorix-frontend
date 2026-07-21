<?php

declare(strict_types=1);

namespace Stackra\Crud\Repositories;

use Stackra\Caching\Support\CacheTagBuilder;
use Stackra\Caching\Support\TaggableCacheGuard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Base class every generated `Eloquent<Model>Repository` extends.
 *
 * ## Responsibilities
 *
 * The base ships the enterprise concerns every Eloquent
 * repository shares — none of which are model-specific:
 *
 *   1. **Tenant-scoped cache tags** — every read passes through
 *      `TaggableCacheGuard::remember(...)` with tags derived
 *      from `<Model>Interface::TABLE` + the current tenant id,
 *      so a single flush wipes a tenant's slice of the entity
 *      collection.
 *
 *   2. **Safe-degradation to untagged cache** — when the active
 *      driver (array / file / db) doesn't support tags, calls
 *      forward to the plain cache. Fixture-free test suites keep
 *      running.
 *
 *   3. **Pagination + CRUD helpers** — `find`, `findOrFail`,
 *      `all`, `paginate`, `create`, `update`, `delete`, `restore`.
 *      The methods sit on the base so per-model repositories only
 *      need to override when domain rules diverge.
 *
 *   4. **Attribute-driven lookups** — `findByAttribute` /
 *      `findManyByAttribute` walk a single column through the
 *      cached query builder. Backed by the interface's `ATTR_*`
 *      column list so callers pass strongly-typed refs, not
 *      raw strings.
 *
 * ## What per-model repositories add
 *
 *   * The `modelClass()` accessor returning the concrete FQCN.
 *   * The `tableName()` accessor returning `<Interface>::TABLE`.
 *   * Any domain-specific query helpers the base doesn't cover
 *     (e.g. `AthleteRepository::activeInBranch(...)`).
 *
 * Everything else stays here so the generated files stay slim,
 * predictable, and easy to override selectively.
 *
 * @template TModel of Model
 */
abstract class AbstractEloquentRepository
{
    /**
     * Default TTL applied to `remember()` calls in seconds
     * (1 hour). Individual queries can bypass this by calling
     * `rememberFor()` with an explicit TTL. Enterprise
     * consumers should tune per-entity by overriding the
     * `cacheTtlSeconds()` method on the concrete repository.
     */
    protected const int CACHE_TTL_SECONDS = 3600;

    /**
     * @param  TaggableCacheGuard $cache     Tag-aware cache facade with degradation.
     * @param  CacheTagBuilder    $cacheTags Composes tenant-scoped tag lists from the resolver chain.
     */
    public function __construct(
        protected readonly TaggableCacheGuard $cache,
        protected readonly CacheTagBuilder $cacheTags,
    ) {}

    /**
     * Return the fully-qualified Eloquent model class this
     * repository owns.
     *
     * @return class-string<TModel>
     */
    abstract protected function modelClass(): string;

    /**
     * Return the table name this repository's model backs
     * (`<Interface>::TABLE`).
     */
    abstract protected function tableName(): string;

    /**
     * TTL override hook — concrete repositories can override to
     * pick a per-entity TTL. Returns 1 hour by default.
     */
    protected function cacheTtlSeconds(): int
    {
        return static::CACHE_TTL_SECONDS;
    }

    /**
     * Build the tenant-scoped tag list for this repository's
     * entity. Called by every cache-touching method.
     *
     * Delegates to the injected {@see CacheTagBuilder} which
     * walks every registered {@see \Stackra\Caching\Contracts\CacheTagResolver}
     * (tenant, locale, feature flag, …) — the resulting list
     * is the union of every enabled resolver's contribution
     * plus the base table segment.
     *
     * @return list<string>
     */
    protected function tags(): array
    {
        return $this->cacheTags->for($this->tableName());
    }

    /**
     * Fluent Eloquent query builder for the owning model.
     *
     * @return Builder<TModel>
     */
    protected function query(): Builder
    {
        $class = $this->modelClass();

        return $class::query();
    }

    // ------------------------------------------------------------
    // Read paths (cached).
    // ------------------------------------------------------------

    /**
     * Fetch by primary key, or null when not found. Cached with
     * a key of `<table>:<id>` under the tenant tag set.
     *
     * @return TModel|null
     */
    public function find(int|string $id): ?Model
    {
        $key = $this->tableName() . ':' . $id;

        return $this->cache->remember(
            $this->tags(),
            $key,
            $this->cacheTtlSeconds(),
            fn () => $this->query()->find($id),
        );
    }

    /**
     * Same as {@see find()} but throws when the row is missing.
     *
     * @return TModel
     *
     * @throws ModelNotFoundException
     */
    public function findOrFail(int|string $id): Model
    {
        $model = $this->find($id);
        if ($model === null) {
            $class = $this->modelClass();

            throw (new ModelNotFoundException())->setModel($class, [$id]);
        }

        return $model;
    }

    /**
     * All rows in the table (bounded by tenant scope). Cached
     * under `<table>:all`.
     *
     * ⚠ Only safe for reference tables (states, currencies,
     * sports). For open-ended collections use {@see paginate()}
     * to avoid loading the full set into memory.
     *
     * @return EloquentCollection<int, TModel>
     */
    public function all(): EloquentCollection
    {
        $key = $this->tableName() . ':all';

        return $this->cache->remember(
            $this->tags(),
            $key,
            $this->cacheTtlSeconds(),
            fn () => $this->query()->get(),
        );
    }

    /**
     * Paginate rows in the table. Uncached — pagination keys
     * are unbounded in practice and the cache-key explosion
     * outweighs the hit rate.
     *
     * Callers that need cached pages can layer their own tag
     * wrapper on top: `$cache->remember($tags, "page:{$n}",
     * $ttl, fn () => $repo->paginate($n))`.
     *
     * @return LengthAwarePaginator<TModel>
     */
    public function paginate(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->query()->paginate(perPage: $perPage, page: $page);
    }

    /**
     * Fetch a single row by any column value. Cached under
     * `<table>:by:<attribute>:<value>`.
     *
     * Prefer this for finder queries where the caller has a
     * strongly-typed attribute constant from the model's
     * `<Interface>::ATTR_*` set.
     *
     * @return TModel|null
     */
    public function findByAttribute(string $attribute, mixed $value): ?Model
    {
        $key = sprintf('%s:by:%s:%s', $this->tableName(), $attribute, $this->cacheKeySegment($value));

        return $this->cache->remember(
            $this->tags(),
            $key,
            $this->cacheTtlSeconds(),
            fn () => $this->query()->where($attribute, $value)->first(),
        );
    }

    /**
     * Fetch every row matching a column value. Same caching
     * scheme as {@see findByAttribute()}.
     *
     * @return EloquentCollection<int, TModel>
     */
    public function findManyByAttribute(string $attribute, mixed $value): EloquentCollection
    {
        $key = sprintf('%s:many-by:%s:%s', $this->tableName(), $attribute, $this->cacheKeySegment($value));

        return $this->cache->remember(
            $this->tags(),
            $key,
            $this->cacheTtlSeconds(),
            fn () => $this->query()->where($attribute, $value)->get(),
        );
    }

    // ------------------------------------------------------------
    // Write paths (bypass cache; invalidation happens via observer).
    // ------------------------------------------------------------

    /**
     * Persist a new row. Cache invalidation fires from the
     * matching model observer's `saved()` callback, so no
     * explicit flush is needed here.
     *
     * @param  array<string, mixed>  $attributes
     * @return TModel
     */
    public function create(array $attributes): Model
    {
        $class = $this->modelClass();

        return $class::query()->create($attributes);
    }

    /**
     * Update by primary key. Returns the fresh model. Emits
     * cache invalidation via the observer.
     *
     * @param  array<string, mixed>  $attributes
     * @return TModel
     */
    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);
        $model->fill($attributes);
        $model->save();

        return $model->refresh();
    }

    /**
     * Soft-delete when SoftDeletes is on the model, otherwise
     * hard-delete. Returns `true` on success.
     */
    public function delete(int|string $id): bool
    {
        $model = $this->findOrFail($id);

        return (bool) $model->delete();
    }

    /**
     * Restore a soft-deleted row. Returns `true` on success;
     * `false` when the model doesn't use SoftDeletes.
     */
    public function restore(int|string $id): bool
    {
        $class = $this->modelClass();
        if (! method_exists($class, 'restore')) {
            return false;
        }

        $model = $class::withTrashed()->find($id);
        if ($model === null) {
            return false;
        }

        return (bool) $model->restore();
    }

    // ------------------------------------------------------------
    // Count paths (cached — same TTL and tag semantics as reads).
    // ------------------------------------------------------------

    /**
     * Total number of rows this repository owns for the current
     * tenant scope. Cached under `<table>:count` behind the
     * tenant-tag set — a flush of any tag in the set (e.g.
     * after a `create`/`update`/`delete`) invalidates the entry
     * on the next request.
     *
     * ## Use cases
     *
     *   * Dashboard widgets that need a "total X" KPI without
     *     paginating the collection.
     *   * Health checks that assert a tenant has at least one
     *     row of a critical entity.
     *   * Admin summary screens that show entity counts across
     *     modules without fetching bodies.
     *
     * ## Notes on tenant scope
     *
     * The underlying `query()` respects any global scopes on
     * the model (including `BelongsToTenant`), so this count
     * is naturally tenant-scoped. Callers should NOT wrap this
     * in `Tenant::withGlobalScope(...)` unless they explicitly
     * want a cross-tenant aggregate — and if they do, that's
     * a code smell to be reviewed.
     */
    public function count(): int
    {
        $key = $this->tableName() . ':count';

        return (int) $this->cache->remember(
            $this->tags(),
            $key,
            $this->cacheTtlSeconds(),
            fn () => $this->query()->count(),
        );
    }

    /**
     * Filtered row count by a single column value. Cached under
     * `<table>:count-by:<attribute>:<value>`.
     *
     * Prefer this over
     * `count($this->findManyByAttribute($attr, $value))` — the
     * count query never hydrates model instances, and the cache
     * key is tighter than the one used for the full-collection
     * finder (making unrelated invalidations less likely to
     * bust the count entry).
     *
     * @param  string  $attribute  Column name — should be a `<Interface>::ATTR_*` constant.
     * @param  mixed  $value  Comparison value. Non-scalars are hashed into the cache key.
     * @return int Non-negative row count.
     */
    public function countByAttribute(string $attribute, mixed $value): int
    {
        $key = sprintf(
            '%s:count-by:%s:%s',
            $this->tableName(),
            $attribute,
            $this->cacheKeySegment($value),
        );

        return (int) $this->cache->remember(
            $this->tags(),
            $key,
            $this->cacheTtlSeconds(),
            fn () => $this->query()->where($attribute, $value)->count(),
        );
    }

    // ------------------------------------------------------------
    // Utilities.
    // ------------------------------------------------------------

    /**
     * Coerce a value into a cache-key-safe segment. Scalars pass
     * through; arrays/objects hash to a short signature so long
     * or non-hashable values don't blow up the key size.
     */
    protected function cacheKeySegment(mixed $value): string
    {
        if (is_scalar($value) || $value === null) {
            return (string) $value;
        }

        return substr(hash('xxh64', json_encode($value) ?: ''), 0, 16);
    }
}
