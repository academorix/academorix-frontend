<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Stackra\Subscription\Data\PlanData;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Exceptions\PlanNotFoundException;

/**
 * `GET /api/v1/platform/plans/{plan}` — read one plan (cross-Application).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.plans.show')]
#[Get('/api/v1/platform/plans/{plan}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformPlansView)]
final class ShowPlan
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
    ) {
    }

    public function __invoke(string $plan): PlanData
    {
        $row = $this->plans->find($plan);
        if ($row === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $plan));
        }

        return PlanData::fromModel($row);
    }
}
