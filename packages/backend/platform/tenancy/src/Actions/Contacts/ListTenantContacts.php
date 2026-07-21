<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Contacts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Repositories\TenantContactRepositoryInterface;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Tenancy\Data\TenantContactData;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\TenantContact;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/current-tenant/contacts` — list the current tenant's
 * named contacts.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.contacts.list')]
#[Get('/api/current-tenant/contacts')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(TenancyPermission::ManageContacts)]
final class ListTenantContacts
{
    use AsController;

    public function __construct(
        private readonly TenantContactRepositoryInterface $contacts,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, TenantContactData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->contacts->paginate()
            ->getCollection()
            ->filter(static fn (TenantContact $c): bool => (string) $c->tenant_id === (string) $tenant->getKey())
            ->values()
            ->map(static fn (TenantContact $c): TenantContactData => TenantContactData::fromModel($c));

        return new DataCollection(TenantContactData::class, $rows);
    }
}
