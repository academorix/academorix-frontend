<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Data\SubscriptionData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Models\Subscription;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/subscriptions` — cross-tenant list of every
 * subscription.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.subscriptions.list')]
#[Get('/api/v1/platform/subscriptions')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformSubscriptionsViewAny)]
final class ListSubscriptions
{
    use AsController;

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    /**
     * @return DataCollection<int, SubscriptionData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->subscriptions
            ->paginate(100)
            ->getCollection()
            ->map(static fn (Subscription $s): SubscriptionData => SubscriptionData::fromModel($s));

        return new DataCollection(SubscriptionData::class, $rows);
    }
}
