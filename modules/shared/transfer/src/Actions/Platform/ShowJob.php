<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Platform;

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
