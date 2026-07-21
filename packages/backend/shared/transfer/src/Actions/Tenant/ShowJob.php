<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Data\XferJobData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferJob;

/**
 * `GET /api/v1/transfer/jobs/{jobId}` — show one job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.jobs.show')]
#[Get('/api/v1/transfer/jobs/{xferJob}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[WhereUlid('xferJob')]
#[RequirePermission(TransferPermission::View)]
final class ShowJob
{
    use AsController;

    public function __invoke(XferJob $xferJob): XferJobData
    {
        return XferJobData::fromModel($xferJob);
    }
}
