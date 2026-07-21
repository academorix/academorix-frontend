<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Services\ImportManagerInterface;
use Stackra\Transfer\Enums\TransferPermission;

/**
 * `POST /api/v1/transfer/imports/preview` — parse first N rows,
 * return headers + suggested mapping. Synchronous.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.imports.preview')]
#[Post('/api/v1/transfer/imports/preview')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-ingest'])]
#[RequirePermission(TransferPermission::ImportsRun)]
final class PreviewImport
{
    use AsController;

    public function __construct(
        private readonly ImportManagerInterface $importer,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function __invoke(): array
    {
        // MVP — real impl reads the uploaded file + entity + rows count.
        return $this->importer->preview('', '', 10);
    }
}
