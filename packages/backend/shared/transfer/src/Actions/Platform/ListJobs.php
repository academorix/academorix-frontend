<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Stackra\Transfer\Data\XferJobData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferJob;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/transfer/jobs` — platform-admin
 * cross-tenant job list.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.platform.jobs.list')]
#[Get('/api/v1/platform/transfer/jobs')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:transfer-platform'])]
#[RequirePermission(TransferPermission::PlatformViewAny)]
final class ListJobs
{
    use AsController;

    public function __construct(
        private readonly XferJobRepositoryInterface $jobs,
    ) {
    }

    /**
     * @return DataCollection<int, XferJobData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->jobs->paginate()
            ->getCollection()
            ->map(static fn (XferJob $j): XferJobData => XferJobData::fromModel($j));

        return new DataCollection(XferJobData::class, $rows);
    }
}
