<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Repositories\SearchIndexRepositoryInterface;
use Academorix\Search\Data\SearchIndexData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchIndex;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
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
