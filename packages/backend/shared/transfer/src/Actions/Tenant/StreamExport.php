<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Data\Requests\CreateExportRequestData;
use Academorix\Transfer\Enums\TransferPermission;

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
