<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Webhook\Contracts\Services\WebhookDestinationRegistryInterface;
use Stackra\Webhook\Enums\WebhookPermission;

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
