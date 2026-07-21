<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferJob;

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
