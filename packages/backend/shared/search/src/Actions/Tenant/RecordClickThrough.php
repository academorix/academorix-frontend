<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Services\AnalyticsRecorderInterface;
use Academorix\Search\Data\Requests\ClickThroughRequestData;
use Academorix\Search\Enums\AnalyticsEventKind;
use Academorix\Search\Enums\SearchPermission;
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
