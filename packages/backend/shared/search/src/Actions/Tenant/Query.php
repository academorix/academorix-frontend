<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Services\SearchServiceInterface;
use Stackra\Search\Data\Requests\QueryRequestData;
use Stackra\Search\Enums\SearchPermission;

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
