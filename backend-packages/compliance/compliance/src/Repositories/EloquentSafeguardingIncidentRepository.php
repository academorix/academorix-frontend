<?php

declare(strict_types=1);

namespace Academorix\Compliance\Repositories;

use Academorix\Compliance\Contracts\Data\SafeguardingIncidentInterface;
use Academorix\Compliance\Contracts\Repositories\SafeguardingIncidentRepositoryInterface;
use Academorix\Compliance\Enums\SafeguardingIncidentState;
use Academorix\Compliance\Models\SafeguardingIncident;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see SafeguardingIncidentRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SafeguardingIncidentInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    SafeguardingIncidentInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    SafeguardingIncidentInterface::ATTR_SUBJECT_TYPE => ['$eq'],
    SafeguardingIncidentInterface::ATTR_SUBJECT_ID   => ['$eq'],
    SafeguardingIncidentInterface::ATTR_SEVERITY     => ['$eq', '$in'],
    SafeguardingIncidentInterface::ATTR_STATE        => ['$eq', '$in'],
])]
final class EloquentSafeguardingIncidentRepository extends Repository implements SafeguardingIncidentRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, SafeguardingIncident> $rows */
        $rows = $this->query()
            ->where(SafeguardingIncidentInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(SafeguardingIncidentInterface::ATTR_REPORTED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * "Overdue" = escalation_deadline_at in the past, state not
     * already escalated / resolved / closed.
     */
    public function findEscalationOverdue(DateTimeInterface $now): Collection
    {
        /** @var Collection<int, SafeguardingIncident> $rows */
        $rows = $this->query()
            ->whereNotNull(SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT)
            ->where(SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT, '<=', $now)
            ->whereIn(
                SafeguardingIncidentInterface::ATTR_STATE,
                [
                    SafeguardingIncidentState::Reported->value,
                    SafeguardingIncidentState::Triaging->value,
                    SafeguardingIncidentState::Investigating->value,
                ],
            )
            ->orderBy(SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT)
            ->get();

        return $rows;
    }
}
