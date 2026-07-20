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
 * `GET /api/v1/platform/search/analytics` — cross-tenant analytics.
 *
 * Aggregated only — raw query text is never emitted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.platform.analytics')]
#[Get('/api/v1/platform/search/analytics')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(SearchPermission::PlatformAnalyticsView)]
final class Analytics
{
    use AsController;

    /**
     * @return array<string, mixed>
     */
    public function __invoke(): array
    {
        // Scaffold — real aggregation dispatch lands with the
        // analytics service build-out.
        return [
            'summary' => [
                'total_queries'    => 0,
                'no_result_rate'   => 0.0,
                'avg_took_ms'      => 0,
                'click_through'    => 0.0,
            ],
            'tenants' => [],
        ];
    }
}
