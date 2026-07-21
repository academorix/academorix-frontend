<?php

declare(strict_types=1);

namespace Stackra\Domains\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Enums\SslStatus;
use Stackra\Domains\Models\Domain;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see DomainRepositoryInterface}.
 *
 * ## Attribute-first wiring
 *
 * `#[AsRepository]` — pre-resolves configuration at boot (Octane-safe).
 * `#[UseModel(DomainInterface::class)]` — the interface's `#[Bind]`
 *   resolves the concrete model.
 * `#[Cacheable(ttl: 60, tags: true)]` — 60s TTL keeps host resolution
 *   fast without preventing DNS + custom-domain edits from reflecting
 *   quickly.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(DomainInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    DomainInterface::ATTR_APPLICATION_ID => ['$eq', '$in'],
    DomainInterface::ATTR_TENANT_ID      => ['$eq', '$in'],
    DomainInterface::ATTR_HOST           => ['$eq', '$contains'],
    DomainInterface::ATTR_KIND           => ['$eq', '$in'],
    DomainInterface::ATTR_SSL_STATUS     => ['$eq', '$in'],
    DomainInterface::ATTR_IS_PRIMARY     => ['$eq'],
])]
final class EloquentDomainRepository extends Repository implements DomainRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByHost(string $applicationId, string $host): ?Domain
    {
        /** @var Domain|null $domain */
        $domain = $this->query()
            ->where(DomainInterface::ATTR_APPLICATION_ID, $applicationId)
            ->where(DomainInterface::ATTR_HOST, \strtolower(\trim($host)))
            ->first();

        return $domain;
    }

    /**
     * {@inheritDoc}
     */
    public function findPrimaryForTenant(string $tenantId): ?Domain
    {
        /** @var Domain|null $domain */
        $domain = $this->query()
            ->where(DomainInterface::ATTR_TENANT_ID, $tenantId)
            ->where(DomainInterface::ATTR_IS_PRIMARY, true)
            ->first();

        return $domain;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, Domain> $rows */
        $rows = $this->query()
            ->where(DomainInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(DomainInterface::ATTR_IS_PRIMARY)
            ->orderBy(DomainInterface::ATTR_HOST)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Certificate rotation picker — issued certs about to expire.
     */
    public function findExpiringBefore(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, Domain> $rows */
        $rows = $this->query()
            ->where(DomainInterface::ATTR_SSL_STATUS, SslStatus::Issued->value)
            ->where(DomainInterface::ATTR_SSL_EXPIRES_AT, '<', $cutoff)
            ->orderBy(DomainInterface::ATTR_SSL_EXPIRES_AT)
            ->get();

        return $rows;
    }
}
