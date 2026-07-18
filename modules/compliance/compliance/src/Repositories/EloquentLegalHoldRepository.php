<?php

declare(strict_types=1);

namespace Academorix\Compliance\Repositories;

use Academorix\Compliance\Contracts\Data\LegalHoldInterface;
use Academorix\Compliance\Contracts\Repositories\LegalHoldRepositoryInterface;
use Academorix\Compliance\Enums\LegalHoldScope;
use Academorix\Compliance\Models\LegalHold;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see LegalHoldRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(LegalHoldInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    LegalHoldInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    LegalHoldInterface::ATTR_SCOPE        => ['$eq', '$in'],
    LegalHoldInterface::ATTR_SUBJECT_TYPE => ['$eq'],
    LegalHoldInterface::ATTR_SUBJECT_ID   => ['$eq'],
    LegalHoldInterface::ATTR_CASE_REF     => ['$eq'],
    LegalHoldInterface::ATTR_TARGET_CLASS => ['$eq'],
])]
final class EloquentLegalHoldRepository extends Repository implements LegalHoldRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findActiveForSubject(string $subjectType, string $subjectId): Collection
    {
        /** @var Collection<int, LegalHold> $rows */
        $rows = $this->applyActiveScope(
            $this->query()
                ->where(LegalHoldInterface::ATTR_SCOPE, LegalHoldScope::Subject->value)
                ->where(LegalHoldInterface::ATTR_SUBJECT_TYPE, $subjectType)
                ->where(LegalHoldInterface::ATTR_SUBJECT_ID, $subjectId),
        )->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findActiveForTenant(string $tenantId): Collection
    {
        /** @var Collection<int, LegalHold> $rows */
        $rows = $this->applyActiveScope(
            $this->query()
                ->where(LegalHoldInterface::ATTR_SCOPE, LegalHoldScope::Tenant->value)
                ->where(LegalHoldInterface::ATTR_TENANT_ID, $tenantId),
        )->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findActiveForClass(string $targetClass): Collection
    {
        /** @var Collection<int, LegalHold> $rows */
        $rows = $this->applyActiveScope(
            $this->query()
                ->where(LegalHoldInterface::ATTR_SCOPE, LegalHoldScope::ClassScope->value)
                ->where(LegalHoldInterface::ATTR_TARGET_CLASS, $targetClass),
        )->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findExpiredBefore(DateTimeInterface $now): Collection
    {
        /** @var Collection<int, LegalHold> $rows */
        $rows = $this->query()
            ->whereNotNull(LegalHoldInterface::ATTR_EXPIRES_AT)
            ->where(LegalHoldInterface::ATTR_EXPIRES_AT, '<=', $now)
            ->whereNull(LegalHoldInterface::ATTR_RELEASED_AT)
            ->orderBy(LegalHoldInterface::ATTR_EXPIRES_AT)
            ->get();

        return $rows;
    }

    /**
     * Apply the "active" scope — not released, not expired.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<LegalHold>  $query
     * @return \Illuminate\Database\Eloquent\Builder<LegalHold>
     */
    private function applyActiveScope($query)
    {
        return $query
            ->whereNull(LegalHoldInterface::ATTR_RELEASED_AT)
            ->where(function ($q): void {
                $q->whereNull(LegalHoldInterface::ATTR_EXPIRES_AT)
                    ->orWhere(LegalHoldInterface::ATTR_EXPIRES_AT, '>', \now());
            });
    }
}
