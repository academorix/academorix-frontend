<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferJob;

/**
 * `GET /api/v1/transfer/jobs/{jobId}/download` — download the
 * result artifact via signed URL.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.jobs.download')]
#[Get('/api/v1/transfer/jobs/{xferJob}/download')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[WhereUlid('xferJob')]
#[RequirePermission(TransferPermission::Download)]
final class DownloadArtifact
{
    use AsController;

    /**
     * @return array<string, mixed>
     */
    public function __invoke(XferJob $xferJob): array
    {
        return [
            'artifact_id' => (string) $xferJob->{XferJobInterface::ATTR_RESULT_ARTIFACT_ID},
        ];
    }
}
