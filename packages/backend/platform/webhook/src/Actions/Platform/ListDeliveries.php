<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Stackra\Webhook\Data\WebhookDeliveryData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Models\WebhookDelivery;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/webhook/deliveries` — every delivery across
 * every tenant. Paginated at the repository layer.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.platform.deliveries.list')]
#[Get('/api/v1/platform/webhook/deliveries')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(WebhookPermission::View)]
final class ListDeliveries
{
    use AsController;

    public function __construct(
        private readonly WebhookDeliveryRepositoryInterface $deliveries,
    ) {
    }

    /**
     * @return DataCollection<int, WebhookDeliveryData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->deliveries->paginate()
            ->getCollection()
            ->map(static fn (WebhookDelivery $d): WebhookDeliveryData => WebhookDeliveryData::fromModel($d));

        return new DataCollection(WebhookDeliveryData::class, $rows);
    }
}
