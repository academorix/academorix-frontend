<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Transfer\Models\XferJob;
use Academorix\Transfer\Repositories\EloquentXferJobRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see XferJob}.
 *
 * @extends RepositoryInterface<XferJob>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(EloquentXferJobRepository::class)]
interface XferJobRepositoryInterface extends RepositoryInterface
{
    /**
     * Every job initiated by a specific user (typically the caller),
     * newest-first.
     *
     * @return Collection<int, XferJob>
     */
    public function findByInitiator(string $initiatorUserId, int $limit = 50): Collection;

    /**
     * In-flight jobs for the tenant — used by the concurrency-limit
     * check at dispatch time.
     *
     * @return Collection<int, XferJob>
     */
    public function findInFlightForTenant(string $tenantId): Collection;

    /**
     * Jobs that have been queued / running past the stale-hours
     * threshold — used by `PruneXferArtifactsJob` pass 3.
     *
     * @return Collection<int, XferJob>
     */
    public function findStale(\DateTimeInterface $cutoff): Collection;
}
