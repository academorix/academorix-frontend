<?php

declare(strict_types=1);

namespace Academorix\Domains\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Domains\Models\Domain;
use Academorix\Domains\Repositories\EloquentDomainRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Domain}.
 *
 * @extends RepositoryInterface<Domain>
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Bind(EloquentDomainRepository::class)]
interface DomainRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve a domain by its host within a specific application.
     *
     * The `resolve.tenant` middleware calls this for custom-domain
     * hosts (i.e. `Host` header does not match the application's
     * `central_host` suffix).
     */
    public function findByHost(string $applicationId, string $host): ?Domain;

    /**
     * The primary domain for a tenant.
     */
    public function findPrimaryForTenant(string $tenantId): ?Domain;

    /**
     * Every domain owned by a tenant (soft-deleted excluded).
     *
     * @return Collection<int, Domain>
     */
    public function findByTenant(string $tenantId): Collection;

    /**
     * Domains with an `ssl_status = issued` that expire before the
     * given cutoff — the certificate rotation scheduler.
     *
     * @return Collection<int, Domain>
     */
    public function findExpiringBefore(\DateTimeInterface $cutoff): Collection;
}
