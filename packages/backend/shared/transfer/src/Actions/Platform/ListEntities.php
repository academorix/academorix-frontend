<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Registry\EntityRegistryInterface;
use Stackra\Transfer\Enums\TransferPermission;

/**
 * `GET /api/v1/platform/transfer/entities` — full registry dump
 * for support triage.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.platform.entities.list')]
#[Get('/api/v1/platform/transfer/entities')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:transfer-platform'])]
#[RequirePermission(TransferPermission::PlatformViewAny)]
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
