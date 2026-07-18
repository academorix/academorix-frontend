<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Tenancy\Contracts\Data\TenantInterface;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Enums\TenantStatus;
use Academorix\Tenancy\Models\Tenant;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see TenantRepositoryInterface}.
 *
 * ## Attribute-first wiring
 *
 * `#[AsRepository]` — pre-resolves configuration at boot (Octane-safe,
 *   zero runtime reflection).
 * `#[UseModel(TenantInterface::class)]` — the interface carries
 *   `#[Bind(Tenant::class)]` so the container resolves the concrete.
 * `#[Cacheable(ttl: 60, tags: true)]` — 60s TTL keeps host resolution
 *   fast (the middleware calls `findByHost` on every request) while
 *   letting DNS + custom-domain edits reflect quickly. Observer-driven
 *   invalidation flushes on write.
 * `#[Filterable([...])]` — filter whitelist for the platform-admin
 *   catalogue.
 *
 * The container binding lives on the interface (`#[Bind(EloquentTenantRepository::class)]`)
 * per Laravel-canonical placement.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TenantInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    TenantInterface::ATTR_APPLICATION_ID => ['$eq', '$in'],
    TenantInterface::ATTR_SLUG           => ['$eq', '$contains', '$startsWith'],
    TenantInterface::ATTR_NAME           => ['$contains', '$startsWith'],
    TenantInterface::ATTR_STATUS         => ['$eq', '$in'],
    TenantInterface::ATTR_BUSINESS_TYPE  => ['$eq', '$in'],
    TenantInterface::ATTR_COUNTRY_CODE   => ['$eq', '$in'],
    TenantInterface::ATTR_IS_SYSTEM      => ['$eq'],
])]
final class EloquentTenantRepository extends Repository implements TenantRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySlug(string $applicationId, string $slug): ?Tenant
    {
        /** @var Tenant|null $tenant */
        $tenant = $this->query()
            ->where(TenantInterface::ATTR_APPLICATION_ID, $applicationId)
            ->where(TenantInterface::ATTR_SLUG, \strtolower(\trim($slug)))
            ->first();

        return $tenant;
    }

    /**
     * {@inheritDoc}
     *
     * The host is `{slug}.{application_central_host}` — the Application
     * resolver strips the trailing `application.central_host` before
     * passing the slug part to `findBySlug` internally.
     */
    public function findByHost(string $applicationId, string $host): ?Tenant
    {
        $host = \strtolower(\trim($host));

        // A tenant host is `{slug}.{something}` — the leading label
        // before the first dot is the tenant slug.
        $slug = \strstr($host, '.', true) ?: $host;

        return $this->findBySlug($applicationId, $slug);
    }

    /**
     * {@inheritDoc}
     */
    public function findByApplication(string $applicationId): Collection
    {
        /** @var Collection<int, Tenant> $tenants */
        $tenants = $this->query()
            ->where(TenantInterface::ATTR_APPLICATION_ID, $applicationId)
            ->orderBy(TenantInterface::ATTR_NAME)
            ->get();

        return $tenants;
    }

    /**
     * {@inheritDoc}
     *
     * Cross-tenant read — always runs without any global tenant scope.
     * The identity table (users) carries the join; this query relies on
     * the User model composing `BelongsToTenant` so `users.tenant_id` is
     * the FK we join on.
     */
    public function findByMemberEmail(string $email): Collection
    {
        /** @var Collection<int, Tenant> $tenants */
        $tenants = $this->query()
            ->whereHas('users', fn ($q) => $q->where('email', \strtolower(\trim($email))))
            ->orderBy(TenantInterface::ATTR_NAME)
            ->get();

        return $tenants;
    }

    /**
     * {@inheritDoc}
     */
    public function findArchivedOlderThan(\DateTimeInterface $olderThan): Collection
    {
        /** @var Collection<int, Tenant> $tenants */
        $tenants = $this->query()
            ->where(TenantInterface::ATTR_STATUS, TenantStatus::Archived->value)
            ->where(TenantInterface::ATTR_ARCHIVED_AT, '<', $olderThan)
            ->where(TenantInterface::ATTR_IS_SYSTEM, false)
            ->get();

        return $tenants;
    }
}
