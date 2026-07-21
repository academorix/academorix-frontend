<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Transfer\Models\XferArtifact;
use Stackra\Transfer\Repositories\EloquentXferArtifactRepository;
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
