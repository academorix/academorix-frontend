<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Stackra\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Stackra\Search\Data\Requests\CreateSynonymRequestData;
use Stackra\Search\Data\SearchSynonymData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/search/synonyms` — tenant admin creates a synonym.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.synonyms.create')]
#[Post('/api/v1/search/synonyms')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::SynonymsCreate)]
final class CreateSynonym
{
    use AsController;

    public function __construct(
        private readonly SearchSynonymRepositoryInterface $synonyms,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateSynonymRequestData $data): SearchSynonymData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $row = $this->synonyms->create([
            SearchSynonymInterface::ATTR_TENANT_ID       => (string) $tenant->getKey(),
            SearchSynonymInterface::ATTR_LANGUAGE        => $data->language,
            SearchSynonymInterface::ATTR_KIND            => $data->kind,
            SearchSynonymInterface::ATTR_TERMS           => $data->terms,
            SearchSynonymInterface::ATTR_ONE_WAY_SOURCE  => $data->oneWaySource,
            SearchSynonymInterface::ATTR_ONE_WAY_TARGETS => $data->oneWayTargets,
            SearchSynonymInterface::ATTR_DESCRIPTION     => $data->description,
        ]);

        return SearchSynonymData::fromModel($row);
    }
}
