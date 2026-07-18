<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Academorix\Transfer\Data\XferJobData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferJob;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/transfer/jobs` — list caller's jobs.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.jobs.list')]
#[Get('/api/v1/transfer/jobs')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[RequirePermission(TransferPermission::ViewAny)]
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
