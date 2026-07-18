<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Jobs\SyncEntitlementsFromPlanJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /api/v1/platform/entitlements/{tenant}/sync-plan` — platform
 * admin triggers a sync from a subscription plan.
 *
 * Dispatches {@see SyncEntitlementsFromPlanJob}. Response is HTTP 202
 * Accepted — the job commits asynchronously.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.platform.sync_plan')]
#[Post('/api/v1/platform/entitlements/{tenant}/sync-plan')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(EntitlementsPermission::Manage)]
final class SyncPlan
{
    use AsController;

    public function __invoke(Request $request, string $tenant): JsonResponse
    {
        $planId = (string) $request->input('plan_id', '');
        if ($planId === '') {
            return new JsonResponse(
                ['error' => ['code' => 'validation', 'message' => 'plan_id is required.']],
                JsonResponse::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        SyncEntitlementsFromPlanJob::dispatch($tenant, $planId);

        return new JsonResponse(
            [
                'accepted' => true,
                'tenant'   => $tenant,
                'plan_id'  => $planId,
            ],
            JsonResponse::HTTP_ACCEPTED,
        );
    }
}
