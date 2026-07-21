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
use Stackra\Transfer\Data\Requests\CreateImportRequestData;
use Stackra\Transfer\Data\XferJobData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Jobs\ImportEntityJob;

/**
 * `POST /api/v1/transfer/imports` — create an import job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.imports.create')]
#[Post('/api/v1/transfer/imports')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-ingest'])]
#[RequirePermission(TransferPermission::ImportsRun)]
final class CreateImport
{
    use AsController;

    public function __construct(
        private readonly XferJobRepositoryInterface $jobs,
    ) {
    }

    public function __invoke(CreateImportRequestData $data): XferJobData
    {
        /** @var \Stackra\Transfer\Models\XferJob $job */
        $job = $this->jobs->create([
            XferJobInterface::ATTR_KIND        => XferKind::Import->value,
            XferJobInterface::ATTR_ENTITY_KEY  => $data->entity,
            XferJobInterface::ATTR_MODE        => $data->mode,
            XferJobInterface::ATTR_FORMAT      => $data->format,
        ]);

        ImportEntityJob::dispatch((string) $job->getKey());

        return XferJobData::fromModel($job);
    }
}
