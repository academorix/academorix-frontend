<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Data\PlanInterface;
use Stackra\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Exceptions\PlanInUseException;
use Stackra\Subscription\Exceptions\PlanNotFoundException;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/plans/{plan}` — soft-delete a plan.
 *
 * Refused when active subscriptions still reference the plan (the
 * observer throws {@see PlanInUseException} on delete).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.plans.archive')]
#[Delete('/api/v1/platform/plans/{plan}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformPlansArchive)]
final class ArchivePlan
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
    ) {
    }

    public function __invoke(string $plan): JsonResponse
    {
        $row = $this->plans->find($plan);
        if ($row === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $plan));
        }

        // Set `archived_at` first so downstream listeners can tell
        // an archive apart from a full delete. The observer's
        // `deleting` hook still runs after this line and refuses when
        // active subscriptions reference the plan.
        $row->{PlanInterface::ATTR_ARCHIVED_AT} = \now();
        $row->save();
        $row->delete();

        return response()->json(status: JsonResponse::HTTP_NO_CONTENT);
    }
}
