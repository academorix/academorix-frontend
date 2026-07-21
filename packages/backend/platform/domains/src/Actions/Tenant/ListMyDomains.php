<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Data\DomainData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/domains` — the caller tenant's domains.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.tenant.list')]
#[Get('/api/v1/tenant/domains')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class ListMyDomains
{
    use AsController;

    public function __construct(
        private readonly DomainRepositoryInterface $domains,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, DomainData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->domains
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (Domain $d): DomainData => DomainData::fromModel($d));

        return new DataCollection(DomainData::class, $rows);
    }
}
