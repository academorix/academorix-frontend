<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Contacts;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Models\TenantContact;
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
