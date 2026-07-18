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
use Academorix\Subscription\Exceptions\SubscriptionNotFoundException;

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
