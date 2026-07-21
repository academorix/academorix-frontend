<?php

declare(strict_types=1);

namespace Stackra\Audit\Repositories;

use Stackra\Audit\Contracts\Data\AuditInterface;
use Stackra\Audit\Contracts\Repositories\AuditRepositoryInterface;
use Stackra\Audit\Models\Audit;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Attribute-first Eloquent implementation of
 * {@see AuditRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 30, tags: true)]` — a deliberately SHORT TTL.
 * Audits are append-only + read-heavy on the compliance surface, so a
 * 30-second cache smooths burst traffic (a compliance sweep hitting
 * the tenant DPO surface) without hiding a fresh audit row from the
 * next request. Tag-based invalidation triggers on every `created`
 * event so writers are never surprised by a stale read.
 *
 * ## Filterable columns
 *
 * The whitelist is deliberately narrow — filtering by
 * `old_values` / `new_values` JSON payloads is a Postgres query
 * hazard we do not enable from the HTTP surface.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(AuditInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    AuditInterface::ATTR_TENANT_ID       => ['$eq', '$in', '$null'],
    AuditInterface::ATTR_EVENT           => ['$eq', '$in'],
    AuditInterface::ATTR_AUDITABLE_TYPE  => ['$eq', '$in'],
    AuditInterface::ATTR_AUDITABLE_ID    => ['$eq'],
    AuditInterface::ATTR_USER_TYPE       => ['$eq', '$in'],
    AuditInterface::ATTR_USER_ID         => ['$eq'],
    AuditInterface::ATTR_CREATED_AT      => ['$gte', '$lte', '$between'],
])]
final class EloquentAuditRepository extends Repository implements AuditRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByAuditable(string $type, string $id): Collection
    {
        /** @var Collection<int, Audit> $rows */
        $rows = $this->query()
            ->where(AuditInterface::ATTR_AUDITABLE_TYPE, $type)
            ->where(AuditInterface::ATTR_AUDITABLE_ID, $id)
            ->orderByDesc(AuditInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByUser(string $userType, string $userId): Collection
    {
        /** @var Collection<int, Audit> $rows */
        $rows = $this->query()
            ->where(AuditInterface::ATTR_USER_TYPE, $userType)
            ->where(AuditInterface::ATTR_USER_ID, $userId)
            ->orderByDesc(AuditInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findForDsar(string $userId, \DateTimeInterface $from, \DateTimeInterface $to): Collection
    {
        // A DSAR search must return every row where the subject
        // participates in any position — actor OR target. The JSON
        // payload search is left to the caller when needed
        // (Postgres `jsonb ?` operator against `old_values` /
        // `new_values`); this method covers the two structured
        // positions the vendor's columns already index.
        /** @var Collection<int, Audit> $rows */
        $rows = $this->query()
            ->where(function ($q) use ($userId): void {
                $q->where(AuditInterface::ATTR_USER_ID, $userId)
                    ->orWhere(AuditInterface::ATTR_AUDITABLE_ID, $userId);
            })
            ->whereBetween(AuditInterface::ATTR_CREATED_AT, [$from, $to])
            ->orderBy(AuditInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findChainBreaks(): Collection
    {
        // Rows that carry a `chain_hash` (chain participated) but
        // have never been marked verified — pending re-verification
        // after a prior walk detected a break.
        /** @var Collection<int, Audit> $rows */
        $rows = $this->query()
            ->whereNotNull(AuditInterface::ATTR_CHAIN_HASH)
            ->whereNull(AuditInterface::ATTR_CHAIN_VERIFIED_AT)
            ->orderBy(AuditInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }
}
