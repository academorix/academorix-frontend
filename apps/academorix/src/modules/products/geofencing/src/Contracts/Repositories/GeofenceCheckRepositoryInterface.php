<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Geofencing\Models\GeofenceCheck;
use Stackra\Geofencing\Repositories\EloquentGeofenceCheckRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see GeofenceCheck}.
 *
 * Adds the audit-log finders + retention pruner on top of the base CRUD
 * surface. Consumers depend on this contract, not on the concrete
 * repository.
 *
 * @extends RepositoryInterface<GeofenceCheck>
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Bind(EloquentGeofenceCheckRepository::class)]
interface GeofenceCheckRepositoryInterface extends RepositoryInterface
{
    /**
     * Every row for a fenceable, newest-first.
     *
     * @return Collection<int, GeofenceCheck>
     */
    public function findByFenceable(string $fenceableType, string $fenceableId): Collection;

    /**
     * Every row for a subject, newest-first.
     *
     * @return Collection<int, GeofenceCheck>
     */
    public function findBySubject(string $subjectType, string $subjectId): Collection;

    /**
     * Every row in a tenant, newest-first + capped by `$limit`.
     *
     * @return Collection<int, GeofenceCheck>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;

    /**
     * Soft-delete non-override rows whose `created_at < $cutoff`.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int;
}
