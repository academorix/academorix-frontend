<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Data\SubscriptionData;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Models\Subscription;
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
