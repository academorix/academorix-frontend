<?php

declare(strict_types=1);

namespace Academorix\Integrations\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Integrations\Enums\IntegrationKind;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Integrations\Repositories\EloquentTenantIntegrationRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see TenantIntegration}.
 *
 * @extends RepositoryInterface<TenantIntegration>
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Bind(EloquentTenantIntegrationRepository::class)]
interface TenantIntegrationRepositoryInterface extends RepositoryInterface
{
    /**
     * The single active integration of a given kind for a tenant.
     *
     * Enforced by the partial-unique index
     * `(tenant_id, kind, is_active) WHERE is_active = TRUE` — at most
     * one row can win this lookup.
     */
    public function findActiveForTenant(string $tenantId, IntegrationKind $kind): ?TenantIntegration;

    /**
     * Every active integration whose `next_sync_at` has arrived.
     *
     * Consumed by {@see \Academorix\Integrations\Console\IntegrationsRotateTokensCommand}
     * and the periodic sync tick.
     *
     * @return Collection<int, TenantIntegration>
     */
    public function findDueForSync(\DateTimeInterface $cutoff): Collection;

    /**
     * Every integration owned by a tenant (active + inactive), sorted
     * by kind then name.
     *
     * @return Collection<int, TenantIntegration>
     */
    public function findByTenant(string $tenantId): Collection;
}
