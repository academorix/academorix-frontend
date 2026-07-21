<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Jobs\SyncEntitlementsFromPlanJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
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
