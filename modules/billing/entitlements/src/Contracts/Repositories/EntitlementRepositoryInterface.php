<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Entitlements\Enums\EntitlementKind;
use Academorix\Entitlements\Models\Entitlement;
use Academorix\Entitlements\Repositories\EloquentEntitlementRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Entitlement}.
 *
 * Adds the four domain finders the resolver + reset jobs need on top
 * of the base CRUD surface. Consumers depend on this contract, not on
 * the concrete `EloquentEntitlementRepository`.
 *
 * @extends RepositoryInterface<Entitlement>
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(EloquentEntitlementRepository::class)]
interface EntitlementRepositoryInterface extends RepositoryInterface
{
    /**
     * Single entitlement for a `(tenant_id, key)` tuple.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $key       Dot-separated identifier (e.g. `webhook.subscriptions.max`).
     * @return Entitlement|null   The row, or null when the caller has no entitlement for `$key`.
     */
    public function findByKey(string $tenantId, string $key): ?Entitlement;

    /**
     * Every entitlement owned by a tenant.
     *
     * @return Collection<int, Entitlement>
     */
    public function findAllForTenant(string $tenantId): Collection;

    /**
     * Every entitlement of a given kind, across every tenant. Used by
     * the reset + reconcile jobs to iterate one kind at a time.
     *
     * @return Collection<int, Entitlement>
     */
    public function findByKind(EntitlementKind $kind): Collection;

    /**
     * Every pool-kind entitlement whose `current_period_ends_at` is
     * before `$cutoff` — i.e. due for a period reset.
     *
     * @return Collection<int, Entitlement>
     */
    public function findExpiringBefore(\DateTimeInterface $cutoff): Collection;
}
