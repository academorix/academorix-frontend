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
use Stackra\Subscription\Exceptions\SubscriptionNotFoundException;

/**
 * `GET /api/v1/platform/subscriptions/{subscription}` — read one
 * subscription cross-tenant.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.subscriptions.show')]
#[Get('/api/v1/platform/subscriptions/{subscription}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformSubscriptionsView)]
final class ShowSubscription
{
    use AsController;

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $subscription): SubscriptionData
    {
        $row = $this->subscriptions->find($subscription);
        if ($row === null) {
            throw new SubscriptionNotFoundException(\sprintf(
                'Subscription "%s" not found.',
                $subscription,
            ));
        }

        return SubscriptionData::fromModel($row);
    }
}
