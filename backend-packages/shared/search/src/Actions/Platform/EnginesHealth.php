<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Enums\SearchPermission;

/**
 * `GET /api/v1/platform/search/engines/health` — live engine reachability.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.engines.health')]
#[Get('/api/v1/platform/search/engines/health')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(SearchPermission::PlatformEnginesView)]
final class EnginesHealth
{
    use AsController;

    /**
     * @return array<string, mixed>
     */
    public function __invoke(): array
    {
        // Scaffold — real engine probing lands with the adapter.
        return [
            'engines' => [
                'meilisearch'   => ['status' => 'unknown', 'latency_ms' => null],
                'postgres-fts'  => ['status' => 'unknown', 'latency_ms' => null],
                'pgvector'      => ['status' => 'unknown', 'latency_ms' => null],
                'elasticsearch' => ['status' => 'disabled', 'latency_ms' => null],
            ],
        ];
    }
}
