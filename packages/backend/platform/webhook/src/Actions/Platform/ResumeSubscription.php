<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Stackra\Webhook\Data\WebhookSubscriptionData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Enums\WebhookSubscriptionStatus;
use Stackra\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `POST /api/v1/platform/webhook/subscriptions/{id}/resume` — platform
 * admin resumes a paused subscription.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.platform.subscriptions.resume')]
#[Post('/api/v1/platform/webhook/subscriptions/{id}/resume')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(WebhookPermission::Manage)]
final class ResumeSubscription
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $id): WebhookSubscriptionData
    {
        $subscription = $this->subscriptions->find($id);
        if ($subscription === null) {
            throw new WebhookSubscriptionNotFoundException(\sprintf(
                'Webhook subscription "%s" not found.',
                $id,
            ));
        }

        $subscription->update([
            WebhookSubscriptionInterface::ATTR_STATUS               => WebhookSubscriptionStatus::Active->value,
            WebhookSubscriptionInterface::ATTR_DISABLED_AT          => null,
            WebhookSubscriptionInterface::ATTR_DISABLED_REASON      => null,
            WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES => 0,
        ]);

        return WebhookSubscriptionData::fromModel($subscription->refresh());
    }
}
