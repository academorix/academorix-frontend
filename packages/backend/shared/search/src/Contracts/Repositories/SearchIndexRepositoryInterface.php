<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Search\Models\SearchIndex;
use Stackra\Search\Repositories\EloquentSearchIndexRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SearchIndex}.
 *
 * Adds tenant-scoped finders on top of the base CRUD surface.
 *
 * @extends RepositoryInterface<SearchIndex>
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(EloquentSearchIndexRepository::class)]
interface SearchIndexRepositoryInterface extends RepositoryInterface
{
    /**
     * Find one index by its model FQCN, scoped to a tenant.
     *
     * @param  string       $modelClass  Fully-qualified model class.
     * @param  string|null  $tenantId    Tenant scope; null for platform indexes.
     */
    public function findByModelClass(string $modelClass, ?string $tenantId = null): ?SearchIndex;

    /**
     * Find every index visible to a tenant.
     *
     * @return Collection<int, SearchIndex>
     */
    public function findByTenant(string $tenantId): Collection;

    /**
     * Find every index registered against a specific engine.
     *
     * @return Collection<int, SearchIndex>
     */
    public function findByEngine(string $engine): Collection;
}
