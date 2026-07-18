<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Jobs\ImportShardJob;

/**
 * `POST /api/v1/transfer/jobs/{jobId}/retry-shard/{shardId}` —
 * re-dispatch a single failed shard.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.jobs.retry_shard')]
#[Post('/api/v1/transfer/jobs/{xferJob}/retry-shard/{shardId}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-ingest'])]
#[WhereUlid('xferJob')]
#[WhereUlid('shardId')]
#[RequirePermission(TransferPermission::RetryShard)]
final class RetryShard
{
    use AsController;

    /**
     * @return array<string, string>
     */
    public function __invoke(string $xferJob, string $shardId): array
    {
        ImportShardJob::dispatch($shardId);

        return ['xfer_job_id' => $xferJob, 'shard_id' => $shardId, 'status' => 'queued'];
    }
}
