<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Data\Requests\CreateExportRequestData;
use Stackra\Transfer\Enums\TransferPermission;

/**
 * `POST /api/v1/transfer/exports/stream` — synchronous inline
 * export for tiny data sets.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.exports.stream')]
#[Post('/api/v1/transfer/exports/stream')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-egress'])]
#[RequirePermission(TransferPermission::ExportsRun)]
final class StreamExport
{
    use AsController;

    /**
     * @return array<string, string>
     */
    public function __invoke(CreateExportRequestData $data): array
    {
        // MVP — the real impl checks the entity's syncThreshold and
        // streams the file back through the response builder.
        return ['status' => 'streamed', 'entity' => $data->entity, 'format' => $data->format];
    }
}
