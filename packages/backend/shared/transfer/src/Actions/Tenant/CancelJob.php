<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Data\XferJobData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Enums\XferJobStatus;
use Stackra\Transfer\Models\XferJob;

/**
 * `POST /api/v1/transfer/jobs/{jobId}/cancel` — cancel a queued /
 * running job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.jobs.cancel')]
#[Post('/api/v1/transfer/jobs/{xferJob}/cancel')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[WhereUlid('xferJob')]
#[RequirePermission(TransferPermission::Cancel)]
final class CancelJob
{
    use AsController;

    public function __invoke(XferJob $xferJob): XferJobData
    {
        $xferJob->fill([
            XferJobInterface::ATTR_STATUS => XferJobStatus::Cancelled->value,
        ])->save();

        return XferJobData::fromModel($xferJob);
    }
}
