<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Services\ImportManagerInterface;
use Academorix\Transfer\Enums\TransferPermission;

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
