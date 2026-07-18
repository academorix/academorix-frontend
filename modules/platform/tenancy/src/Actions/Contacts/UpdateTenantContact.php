<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Contacts;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Data\Requests\UpdateTenantContactRequestData;
use Academorix\Tenancy\Data\TenantContactData;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Models\TenantContact;

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
