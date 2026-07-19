<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Data\SearchSynonymInterface;
use Academorix\Search\Contracts\Repositories\SearchSynonymRepositoryInterface;
use Academorix\Search\Data\Requests\CreateSynonymRequestData;
use Academorix\Search\Data\SearchSynonymData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

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
