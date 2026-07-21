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
use Stackra\Transfer\Data\Requests\CreateSampleRequestData;
use Stackra\Transfer\Data\XferJobData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Jobs\GenerateSampleDataJob;

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
        /** @var \Stackra\Transfer\Models\XferJob $job */
        $job = $this->jobs->create([
            XferJobInterface::ATTR_KIND       => XferKind::Sample->value,
            XferJobInterface::ATTR_ENTITY_KEY => $data->entity,
            XferJobInterface::ATTR_METADATA   => ['count' => $data->count],
        ]);

        GenerateSampleDataJob::dispatch((string) $job->getKey());

        return XferJobData::fromModel($job);
    }
}
