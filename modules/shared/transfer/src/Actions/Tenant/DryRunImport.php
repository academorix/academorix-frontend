<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Enums\TransferPermission;

/**
 * `POST /api/v1/transfer/imports/dry-run` — run the full import
 * inside a rolled-back transaction. Synchronous.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.imports.dry_run')]
#[Post('/api/v1/transfer/imports/dry-run')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-ingest'])]
#[RequirePermission(TransferPermission::ImportsRun)]
final class DryRunImport
{
    use AsController;

    /**
     * @return array<string, mixed>
     */
    public function __invoke(): array
    {
        // MVP shape — a real impl wraps the import in a rolled-back
        // transaction and returns counters + errors.
        return [
            'counters' => ['total' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0],
            'errors'   => [],
        ];
    }
}
