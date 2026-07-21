<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Platform;

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
 * `GET /api/v1/platform/transfer/jobs/{jobId}` — platform-admin
 * cross-tenant job show.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.platform.jobs.show')]
#[Get('/api/v1/platform/transfer/jobs/{xferJob}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:transfer-platform'])]
#[WhereUlid('xferJob')]
#[RequirePermission(TransferPermission::PlatformView)]
final class ShowJob
{
    use AsController;

    public function __invoke(XferJob $xferJob): XferJobData
    {
        return XferJobData::fromModel($xferJob);
    }
}
