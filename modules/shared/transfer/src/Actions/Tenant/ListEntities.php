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
 * `GET /api/v1/transfer/entities` — list capabilities.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.entities.list')]
#[Get('/api/v1/transfer/entities')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[RequirePermission(TransferPermission::EntitiesViewAny)]
final class ListEntities
{
    use AsController;

    public function __construct(
        private readonly EntityRegistryInterface $entities,
    ) {
    }

    /**
     * @return array<string, list<string>>
     */
    public function __invoke(): array
    {
        return [
            'importable' => $this->entities->importableKeys(),
            'exportable' => $this->entities->exportableKeys(),
            'sampleable' => $this->entities->sampleableKeys(),
        ];
    }
}
