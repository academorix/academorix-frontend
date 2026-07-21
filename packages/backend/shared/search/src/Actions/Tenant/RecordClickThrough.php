<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Services\AnalyticsRecorderInterface;
use Stackra\Search\Data\Requests\ClickThroughRequestData;
use Stackra\Search\Enums\AnalyticsEventKind;
use Stackra\Search\Enums\SearchPermission;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/search/click` — record a click-through event.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.click')]
#[Post('/api/v1/search/click')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SearchPermission::ClickRecord)]
final class RecordClickThrough
{
    use AsController;

    public function __construct(
        private readonly AnalyticsRecorderInterface $analytics,
    ) {
    }

    public function __invoke(ClickThroughRequestData $data): JsonResponse
    {
        $this->analytics->record(AnalyticsEventKind::ClickThrough, [
            'search_session_id'   => $data->searchSessionId,
            'clicked_result_type' => $data->clickedResultType,
            'clicked_result_id'   => $data->clickedResultId,
            'clicked_position'    => $data->clickedPosition,
        ]);

        return \response()->json(['status' => 'accepted'], JsonResponse::HTTP_ACCEPTED);
    }
}
