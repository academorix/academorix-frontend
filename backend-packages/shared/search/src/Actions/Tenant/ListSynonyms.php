<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Academorix\Search\Data\SearchSynonymData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSynonym;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/search/synonyms` — list synonyms visible to the tenant.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.synonyms.list')]
#[Get('/api/v1/search/synonyms')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::SynonymsViewAny)]
final class ListSynonyms
{
    use AsController;

    public function __construct(
        private readonly SearchSynonymRepositoryInterface $synonyms,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, SearchSynonymData>
     */
    public function __invoke(): DataCollection
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $language = (string) \config('app.locale', 'en');

        $rows = $this->synonyms
            ->activeFor((string) $tenant->getKey(), $language)
            ->map(static fn (SearchSynonym $s): SearchSynonymData => SearchSynonymData::fromModel($s));

        return new DataCollection(SearchSynonymData::class, $rows);
    }
}
