<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Transfer\Models\XferShard;
use Academorix\Transfer\Repositories\EloquentXferShardRepository;
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
