<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Contacts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Repositories\TenantContactRepositoryInterface;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Tenancy\Data\Requests\CreateTenantContactRequestData;
use Stackra\Tenancy\Data\TenantContactData;
use Stackra\Tenancy\Enums\TenancyPermission;

/**
 * `POST /api/current-tenant/contacts` — create a tenant contact.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.contacts.create')]
#[Post('/api/current-tenant/contacts')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(TenancyPermission::ManageContacts)]
final class CreateTenantContact
{
    use AsController;

    public function __construct(
        private readonly TenantContactRepositoryInterface $contacts,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateTenantContactRequestData $data): TenantContactData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $contact = $this->contacts->create([
            'tenant_id'  => (string) $tenant->getKey(),
            'kind'       => $data->kind->value,
            'name'       => $data->name,
            'email'      => $data->email,
            'phone'      => $data->phone,
            'job_title'  => $data->jobTitle,
            'address'    => $data->address,
            'notes'      => $data->notes,
            'is_primary' => $data->isPrimary,
        ]);

        return TenantContactData::fromModel($contact);
    }
}
