<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Academorix\Webhook\Data\WebhookDeliveryData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Models\WebhookDelivery;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/webhook/deliveries` — deliveries for the
 * caller's tenant (auto-scoped by `BelongsToTenant`). Paginated at
 * the repository layer.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.deliveries.list')]
#[Get('/api/v1/tenant/webhook/deliveries')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
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
