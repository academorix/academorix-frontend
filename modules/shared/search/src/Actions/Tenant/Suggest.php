<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Services\SuggestServiceInterface;
use Academorix\Search\Data\Requests\SuggestRequestData;
use Academorix\Search\Enums\SearchPermission;

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
