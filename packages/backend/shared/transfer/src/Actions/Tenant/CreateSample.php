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
use Academorix\Transfer\Data\Requests\CreateSampleRequestData;
use Academorix\Transfer\Data\XferJobData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Enums\XferKind;
use Academorix\Transfer\Jobs\GenerateSampleDataJob;

/**
 * `POST /api/v1/transfer/samples` — create a sample-data
 * generation job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.samples.create')]
#[Post('/api/v1/transfer/samples')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-ingest'])]
#[RequirePermission(TransferPermission::SamplesGenerate)]
final class CreateSample
{
    use AsController;

    public function __construct(
        private readonly XferJobRepositoryInterface $jobs,
    ) {
    }

    public function __invoke(CreateSampleRequestData $data): XferJobData
    {
        /** @var \Academorix\Transfer\Models\XferJob $job */
        $job = $this->jobs->create([
            XferJobInterface::ATTR_KIND       => XferKind::Sample->value,
            XferJobInterface::ATTR_ENTITY_KEY => $data->entity,
            XferJobInterface::ATTR_METADATA   => ['count' => $data->count],
        ]);

        GenerateSampleDataJob::dispatch((string) $job->getKey());

        return XferJobData::fromModel($job);
    }
}
