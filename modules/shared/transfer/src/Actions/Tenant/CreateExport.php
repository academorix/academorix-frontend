<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Academorix\Transfer\Data\Requests\CreateExportRequestData;
use Academorix\Transfer\Data\XferJobData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Enums\XferKind;
use Academorix\Transfer\Jobs\ExportEntityJob;

/**
 * `POST /api/v1/transfer/exports` — create an export job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.exports.create')]
#[Post('/api/v1/transfer/exports')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-egress'])]
#[RequirePermission(TransferPermission::ExportsRun)]
final class CreateExport
{
    use AsController;

    public function __construct(
        private readonly XferJobRepositoryInterface $jobs,
    ) {
    }

    public function __invoke(CreateExportRequestData $data): XferJobData
    {
        /** @var \Academorix\Transfer\Models\XferJob $job */
        $job = $this->jobs->create([
            XferJobInterface::ATTR_KIND       => XferKind::Export->value,
            XferJobInterface::ATTR_ENTITY_KEY => $data->entity,
            XferJobInterface::ATTR_FORMAT     => $data->format,
            XferJobInterface::ATTR_FILTERS    => $data->filters,
        ]);

        ExportEntityJob::dispatch((string) $job->getKey());

        return XferJobData::fromModel($job);
    }
}
