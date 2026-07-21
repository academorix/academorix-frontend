<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Stackra\Webhook\Data\WebhookSubscriptionData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

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
