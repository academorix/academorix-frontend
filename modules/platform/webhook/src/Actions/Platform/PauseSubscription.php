<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Data\WebhookSubscriptionData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Enums\WebhookSubscriptionStatus;
use Academorix\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `POST /api/v1/platform/webhook/subscriptions/{id}/pause` — platform
 * admin pauses a subscription cross-tenant (typical during a
 * receiver-side incident).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.platform.subscriptions.pause')]
#[Post('/api/v1/platform/webhook/subscriptions/{id}/pause')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(WebhookPermission::Manage)]
final class PauseSubscription
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
            WebhookSubscriptionInterface::ATTR_STATUS => WebhookSubscriptionStatus::Paused->value,
        ]);

        return WebhookSubscriptionData::fromModel($subscription->refresh());
    }
}
