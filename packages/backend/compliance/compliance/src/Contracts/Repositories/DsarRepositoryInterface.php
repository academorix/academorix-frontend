<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Repositories;

use Academorix\Compliance\Models\Dsar;
use Academorix\Compliance\Repositories\EloquentDsarRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Dsar}.
 *
 * @extends RepositoryInterface<Dsar>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentDsarRepository::class)]
interface DsarRepositoryInterface extends RepositoryInterface
{
    /**
     * Every DSAR for one tenant, newest first.
     *
     * @return Collection<int, Dsar>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;

    /**
     * Every DSAR filed by one subject.
     *
     * @return Collection<int, Dsar>
     */
    public function findBySubject(string $subjectType, string $subjectId): Collection;
}
