<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Data\XferJobData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Enums\XferJobStatus;
use Academorix\Transfer\Models\XferJob;

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
