<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Stackra\Webhook\Data\Requests\RetryWebhookDeliveryRequestData;
use Stackra\Webhook\Data\WebhookDeliveryData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Exceptions\WebhookDeliveryFailedException;
use Stackra\Webhook\Jobs\DispatchWebhookJob;

/**
 * `POST /api/v1/tenant/webhook/deliveries/{id}/retry` — manual retry
 * of a failed delivery. Dispatches
 * {@see DispatchWebhookJob} with the same delivery id — the job
 * handles rate limiting + status transitions.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.deliveries.retry')]
#[Post('/api/v1/tenant/webhook/deliveries/{id}/retry')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class RetryDelivery
{
    use AsController;

    public function __construct(
        private readonly WebhookDeliveryRepositoryInterface $deliveries,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $id, RetryWebhookDeliveryRequestData $data): WebhookDeliveryData
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $delivery = $this->deliveries->find($id);

        if ($delivery === null
            || (string) $delivery->{WebhookDeliveryInterface::ATTR_TENANT_ID} !== (string) $tenant->getKey()
        ) {
            throw new WebhookDeliveryFailedException(\sprintf(
                'Webhook delivery "%s" not found for this tenant.',
                $id,
            ));
        }

        DispatchWebhookJob::dispatch((string) $delivery->getKey());

        return WebhookDeliveryData::fromModel($delivery);
    }
}
