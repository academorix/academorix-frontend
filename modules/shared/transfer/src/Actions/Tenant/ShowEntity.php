<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Services\EntityRegistryInterface;
use Academorix\Transfer\Enums\TransferPermission;

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
