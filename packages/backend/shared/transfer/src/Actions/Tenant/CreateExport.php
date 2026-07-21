<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Stackra\Transfer\Data\Requests\CreateExportRequestData;
use Stackra\Transfer\Data\XferJobData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Jobs\ExportEntityJob;

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
        /** @var \Stackra\Transfer\Models\XferJob $job */
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
