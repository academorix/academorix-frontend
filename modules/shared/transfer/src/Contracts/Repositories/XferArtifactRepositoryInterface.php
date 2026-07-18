<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Transfer\Models\XferArtifact;
use Academorix\Transfer\Repositories\EloquentXferArtifactRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see XferArtifact}.
 *
 * @extends RepositoryInterface<XferArtifact>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(EloquentXferArtifactRepository::class)]
interface XferArtifactRepositoryInterface extends RepositoryInterface
{
    /**
     * Every artifact belonging to a job.
     *
     * @return Collection<int, XferArtifact>
     */
    public function findByJob(string $xferJobId): Collection;

    /**
     * Artifacts past their retention_expires_at that still have a
     * populated path (i.e. not yet purged).
     *
     * @return Collection<int, XferArtifact>
     */
    public function findExpired(\DateTimeInterface $cutoff, int $limit = 1000): Collection;
}
