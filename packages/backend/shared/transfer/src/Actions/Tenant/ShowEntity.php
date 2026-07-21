<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Services\EntityRegistryInterface;
use Stackra\Transfer\Enums\TransferPermission;

/**
 * `GET /api/v1/transfer/entities/{entity}` — capability detail.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.entities.show')]
#[Get('/api/v1/transfer/entities/{entity}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[RequirePermission(TransferPermission::EntitiesView)]
final class ShowEntity
{
    use AsController;

    public function __construct(
        private readonly EntityRegistryInterface $entities,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function __invoke(string $entity): array
    {
        return [
            'entity_key'       => $entity,
            'importable_model' => $this->entities->importableModel($entity),
            'exportable_model' => $this->entities->exportableModel($entity),
        ];
    }
}
