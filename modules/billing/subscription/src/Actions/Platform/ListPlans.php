<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Data\PlanData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Models\Plan;
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
