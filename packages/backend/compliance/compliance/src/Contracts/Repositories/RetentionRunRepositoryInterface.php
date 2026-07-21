<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Repositories;

use Stackra\Compliance\Models\RetentionRun;
use Stackra\Compliance\Repositories\EloquentRetentionRunRepository;
use Stackra\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see RetentionRun}.
 *
 * @extends RepositoryInterface<RetentionRun>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentRetentionRunRepository::class)]
interface RetentionRunRepositoryInterface extends RepositoryInterface
{
    /**
     * Every run for one tenant, newest first.
     *
     * @return Collection<int, RetentionRun>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;
}
