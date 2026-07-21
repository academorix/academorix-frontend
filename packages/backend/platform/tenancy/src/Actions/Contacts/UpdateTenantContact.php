<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Contacts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Data\Requests\UpdateTenantContactRequestData;
use Stackra\Tenancy\Data\TenantContactData;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\TenantContact;

/**
 * `PATCH /api/current-tenant/contacts/{contact}` — update a contact.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.contacts.update')]
#[Patch('/api/current-tenant/contacts/{contact}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('contact')]
#[RequirePermission(TenancyPermission::ManageContacts)]
final class UpdateTenantContact
{
    use AsController;

    public function __invoke(
        TenantContact $contact,
        UpdateTenantContactRequestData $data,
    ): TenantContactData {
        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );

        $contact->update($payload);

        return TenantContactData::fromModel($contact->refresh());
    }
}
