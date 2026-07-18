<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\States;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\StateRepositoryInterface;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\State;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/geography/states/{state}` — platform
 * admin deletes a state row. The observer refuses when downstream
 * cities still reference the row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.states.delete')]
#[Delete('/api/v1/platform/geography/states/{state}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class DeleteState
{
    use AsController;

    public function __construct(
        private readonly StateRepositoryInterface $states,
    ) {
    }

    public function __invoke(State $state): JsonResponse
    {
        $this->states->delete((string) $state->getKey());

        return \response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
