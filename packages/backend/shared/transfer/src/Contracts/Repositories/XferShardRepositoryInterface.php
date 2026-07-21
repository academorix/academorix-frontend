<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Transfer\Models\XferShard;
use Stackra\Transfer\Repositories\EloquentXferShardRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see XferShard}.
 *
 * @extends RepositoryInterface<XferShard>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(EloquentXferShardRepository::class)]
interface XferShardRepositoryInterface extends RepositoryInterface
{
    /**
     * All shards for a job, ordered by shard index.
     *
     * @return Collection<int, XferShard>
     */
    public function findByJob(string $xferJobId): Collection;

    /**
     * All failed shards for a job — used by retry + coordinator paths.
     *
     * @return Collection<int, XferShard>
     */
    public function findFailedForJob(string $xferJobId): Collection;
}
