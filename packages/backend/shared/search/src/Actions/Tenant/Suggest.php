<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Services\SuggestServiceInterface;
use Stackra\Search\Data\Requests\SuggestRequestData;
use Stackra\Search\Enums\SearchPermission;

/**
 * `GET /api/v1/search/suggest` — autocomplete lookup.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.suggest')]
#[Get('/api/v1/search/suggest')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::Suggest)]
final class Suggest
{
    use AsController;

    public function __construct(
        private readonly SuggestServiceInterface $suggestService,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function __invoke(SuggestRequestData $data): array
    {
        return [
            'q'           => $data->q,
            'suggestions' => $this->suggestService->suggest($data->q, [
                'index'    => $data->index,
                'limit'    => $data->limit,
                'language' => $data->language,
            ]),
        ];
    }
}
