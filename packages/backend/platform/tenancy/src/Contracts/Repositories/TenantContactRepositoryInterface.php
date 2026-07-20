<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Tenancy\Enums\TenantContactKind;
use Academorix\Tenancy\Models\TenantContact;
use Academorix\Tenancy\Repositories\EloquentTenantContactRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see TenantContact}.
 *
 * CRUD comes from {@see RepositoryInterface}. Domain finders below
 * cover the "primary contact per kind" lookups the observer + policy
 * consult on every write.
 *
 * @extends RepositoryInterface<TenantContact>
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Bind(EloquentTenantContactRepository::class)]
interface TenantContactRepositoryInterface extends RepositoryInterface
{
    /**
     * The primary contact of a given kind for a tenant.
     *
     * Exactly one primary per `(tenant_id, kind)` is enforced by a
     * partial unique index. Returns `null` when no primary is set for
     * that kind.
     *
     * @param  string             $tenantId  Owning tenant.
     * @param  TenantContactKind  $kind      Contact kind (billing / legal / dpo …).
     * @return TenantContact|null  Primary contact or `null`.
     */
    public function findPrimary(string $tenantId, TenantContactKind $kind): ?TenantContact;

    /**
     * Every contact of a given kind for a tenant.
     *
     * @param  string             $tenantId  Owning tenant.
     * @param  TenantContactKind  $kind      Contact kind.
     * @return Collection<int, TenantContact>  Contacts (soft-deleted excluded).
     */
    public function findByKind(string $tenantId, TenantContactKind $kind): Collection;

    /**
     * Find contacts by email within a tenant. GDPR discovery helper.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $email     Contact email (case-insensitive).
     * @return Collection<int, TenantContact>  Matching rows.
     */
    public function findByEmail(string $tenantId, string $email): Collection;
}
