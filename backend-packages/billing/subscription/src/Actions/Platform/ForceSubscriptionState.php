<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Data\Requests\ForceSubscriptionStateRequestData;
use Academorix\Subscription\Data\SubscriptionData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Exceptions\SubscriptionNotFoundException;

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
