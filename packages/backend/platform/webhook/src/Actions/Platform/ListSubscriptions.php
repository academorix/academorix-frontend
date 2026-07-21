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
use Stackra\Webhook\Models\WebhookSubscription;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/webhook/subscriptions` — every subscription
 * across every tenant. Paginated at the repository layer.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.platform.subscriptions.list')]
#[Get('/api/v1/platform/webhook/subscriptions')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(WebhookPermission::View)]
final class ListSubscriptions
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    /**
     * @return DataCollection<int, WebhookSubscriptionData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->subscriptions->paginate()
            ->getCollection()
            ->map(static fn (WebhookSubscription $s): WebhookSubscriptionData => WebhookSubscriptionData::fromModel($s));

        return new DataCollection(WebhookSubscriptionData::class, $rows);
    }
}
