<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Jobs\ImportShardJob;

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
