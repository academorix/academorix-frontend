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
use Stackra\Subscription\Models\Plan;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/plans` — cross-Application list of every
 * plan in the catalogue.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.plans.list')]
#[Get('/api/v1/platform/plans')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformPlansViewAny)]
final class ListPlans
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
    ) {
    }

    /**
     * @return DataCollection<int, PlanData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->plans
            ->paginate(100)
            ->getCollection()
            ->map(static fn (Plan $p): PlanData => PlanData::fromModel($p));

        return new DataCollection(PlanData::class, $rows);
    }
}
