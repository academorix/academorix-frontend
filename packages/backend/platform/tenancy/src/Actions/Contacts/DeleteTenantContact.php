<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Contacts;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\TenantContact;
use Illuminate\Http\Response;

/**
 * `DELETE /api/current-tenant/contacts/{contact}` — soft-delete a
 * contact. The policy refuses when the target is the last DPO for a
 * GDPR-subject tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.contacts.delete')]
#[Delete('/api/current-tenant/contacts/{contact}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('contact')]
#[RequirePermission(TenancyPermission::ManageContacts)]
final class DeleteTenantContact
{
    use AsController;

    public function __invoke(TenantContact $contact): Response
    {
        $contact->delete();

        return \response()->noContent();
    }
}
