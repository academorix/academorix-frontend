<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Data\Requests\ForceSubscriptionStateRequestData;
use Stackra\Subscription\Data\SubscriptionData;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Exceptions\SubscriptionNotFoundException;

/**
 * `POST /api/v1/platform/subscriptions/{tenant}/force-state` —
 * emergency state override. Every use is audit-logged with a
 * mandatory reason via the subscription observer.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.subscriptions.force_state')]
#[Post('/api/v1/platform/subscriptions/{tenant}/force-state')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformSubscriptionsForceState)]
final class ForceSubscriptionState
{
    use AsController;

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $tenant, ForceSubscriptionStateRequestData $data): SubscriptionData
    {
        $subscription = $this->subscriptions->findActiveForTenant($tenant);
        if ($subscription === null) {
            throw new SubscriptionNotFoundException(\sprintf(
                'No active subscription for tenant "%s".',
                $tenant,
            ));
        }

        // Merge the reason into the subscription metadata so the
        // audit trail carries it. The observer's `updated` hook will
        // fire the matching state event.
        $metadata = $subscription->{SubscriptionInterface::ATTR_METADATA} ?? [];
        if (\is_array($metadata)) {
            $metadata['force_state_reason'] = $data->reason;
        }

        $subscription->{SubscriptionInterface::ATTR_STATE}    = $data->state;
        $subscription->{SubscriptionInterface::ATTR_METADATA} = $metadata;
        $subscription->save();

        return SubscriptionData::fromModel($subscription->refresh());
    }
}
