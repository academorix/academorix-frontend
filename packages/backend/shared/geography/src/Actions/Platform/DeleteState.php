<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\StateRepositoryInterface;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\State;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
