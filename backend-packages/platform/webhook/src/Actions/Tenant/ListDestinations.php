<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Webhook\Contracts\Services\WebhookDestinationRegistryInterface;
use Academorix\Webhook\Enums\WebhookPermission;

/**
 * `GET /api/v1/tenant/webhook/destinations` — destination drivers
 * the tenant may pick from when creating a subscription. Reads from
 * {@see WebhookDestinationRegistryInterface}.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.destinations.list')]
#[Get('/api/v1/tenant/webhook/destinations')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class ListDestinations
{
    use AsController;

    public function __construct(
        private readonly WebhookDestinationRegistryInterface $registry,
    ) {
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     supports_batching: bool,
     *     required_config: list<string>,
     * }>
     */
    public function __invoke(): array
    {
        $rows = [];
        foreach ($this->registry->all() as $name => $definition) {
            $rows[] = [
                'name'              => $name,
                'supports_batching' => $definition['supports_batching'],
                'required_config'   => $definition['required_config'],
            ];
        }

        return $rows;
    }
}
