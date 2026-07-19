<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Data\XferJobData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferJob;

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
