<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Services\EntityRegistryInterface;
use Academorix\Transfer\Enums\TransferPermission;

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
