<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Tenancy\Models\Tenant;
use Stackra\Tenancy\Repositories\EloquentTenantRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Tenant}.
 *
 * CRUD comes from {@see RepositoryInterface} (via `stackra/crud`'s
 * `Repository` base). Domain finders below cover host resolution +
 * per-application enumeration + per-user "my tenants" lookups.
 *
 * `#[Bind]` follows Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see EloquentTenantRepository}).
 *
 * @extends RepositoryInterface<Tenant>
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Bind(EloquentTenantRepository::class)]
interface TenantRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve a Tenant by its slug within a specific Application.
     *
     * Slugs are unique per `(application_id, slug)` (a partial unique
     * index enforces the invariant at the DB level).
     *
     * @param  string  $applicationId  Owning Application id.
     * @param  string  $slug           URL-safe identifier (lowercase, kebab-safe).
     * @return Tenant|null  Matching row or `null`.
     */
    public function findBySlug(string $applicationId, string $slug): ?Tenant;

    /**
     * Resolve a Tenant by its subdomain host — `{slug}.{central_host}`.
     *
     * The `resolve.tenant` middleware calls this on every tenant-host
     * request. The Application is resolved first (by host); this
     * lookup then matches the tenant slug within it.
     *
     * @param  string  $applicationId  Owning Application id.
     * @param  string  $host           Incoming request host (lowercase, no port).
     * @return Tenant|null  Matching row or `null`.
     */
    public function findByHost(string $applicationId, string $host): ?Tenant;

    /**
     * Enumerate every Tenant on a given Application. Used by the
     * platform-admin catalogue list.
     *
     * @param  string  $applicationId  Owning Application id.
     * @return Collection<int, Tenant>  All tenants (soft-deleted excluded).
     */
    public function findByApplication(string $applicationId): Collection;

    /**
     * "My tenants" lookup — every Tenant a given email address is a
     * member of, across every Application. Used by the central "find
     * my tenants" flow (`POST /api/v1/auth/find-tenants`).
     *
     * @param  string  $email  Identity email (lowercased).
     * @return Collection<int, Tenant>  Matching tenants.
     */
    public function findByMemberEmail(string $email): Collection;

    /**
     * Archived tenants past the retention window — the
     * `tenancy:hard-delete-archived` command's picker.
     *
     * @param  \DateTimeInterface  $olderThan  Cutoff datetime.
     * @return Collection<int, Tenant>  Rows eligible for hard-delete.
     */
    public function findArchivedOlderThan(\DateTimeInterface $olderThan): Collection;
}
