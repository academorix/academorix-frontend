<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Stackra\Search\Data\SearchSynonymData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSynonym;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
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
