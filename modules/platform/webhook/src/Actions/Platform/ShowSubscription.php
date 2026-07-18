<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Data\WebhookSubscriptionData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `GET /api/v1/platform/webhook/subscriptions/{id}` — platform-admin
 * lookup for a specific subscription (any tenant).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.platform.subscriptions.show')]
#[Get('/api/v1/platform/webhook/subscriptions/{id}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(WebhookPermission::View)]
final class ShowSubscription
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

        return WebhookSubscriptionData::fromModel($subscription);
    }
}
