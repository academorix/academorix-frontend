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
use Academorix\Webhook\Models\WebhookSubscription;
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
