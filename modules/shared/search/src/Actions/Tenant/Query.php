<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Services\SearchServiceInterface;
use Academorix\Search\Data\Requests\QueryRequestData;
use Academorix\Search\Enums\SearchPermission;

/**
 * `GET /api/v1/search` — run one unified search query.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.query')]
#[Get('/api/v1/search')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::Query)]
final class Query
{
    use AsController;

    public function __construct(
        private readonly SearchServiceInterface $search,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function __invoke(QueryRequestData $data): array
    {
        return $this->search->query($data->q, [
            'index'     => $data->index,
            'page'      => $data->page,
            'per_page'  => $data->perPage,
            'language'  => $data->language,
            'highlight' => $data->highlight,
        ]);
    }
}
