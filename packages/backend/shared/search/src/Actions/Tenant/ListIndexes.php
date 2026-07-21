<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Stackra\Search\Data\SearchIndexData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchIndex;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/search/indexes` — list indexes visible to the tenant.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.indexes.list')]
#[Get('/api/v1/search/indexes')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::IndexesViewAny)]
final class ListIndexes
{
    use AsController;

    public function __construct(
        private readonly SearchIndexRepositoryInterface $indexes,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, SearchIndexData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->indexes
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (SearchIndex $i): SearchIndexData => SearchIndexData::fromModel($i));

        return new DataCollection(SearchIndexData::class, $rows);
    }
}
