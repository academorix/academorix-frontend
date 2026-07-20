<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Repositories;

use Academorix\Compliance\Models\SafeguardingIncident;
use Academorix\Compliance\Repositories\EloquentSafeguardingIncidentRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SafeguardingIncident}.
 *
 * @extends RepositoryInterface<SafeguardingIncident>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentSafeguardingIncidentRepository::class)]
interface SafeguardingIncidentRepositoryInterface extends RepositoryInterface
{
    /**
     * Every incident for one tenant, newest first.
     *
     * @return Collection<int, SafeguardingIncident>
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection;

    /**
     * Incidents whose `escalation_deadline_at` has passed and that
     * have not yet been escalated. Consumed by
     * `EscalateSafeguardingIncidentJob`.
     *
     * @return Collection<int, SafeguardingIncident>
     */
    public function findEscalationOverdue(DateTimeInterface $now): Collection;
}
