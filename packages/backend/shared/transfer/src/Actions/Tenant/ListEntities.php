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
