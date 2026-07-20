<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Exceptions\LastPrimaryDomainException;
use Academorix\Domains\Models\Domain;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/tenant/domains/{domain}` — tenant admin removes
 * their own domain. Refuses when the target is the tenant's last
 * primary (would orphan the tenant).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.tenant.remove')]
#[Delete('/api/v1/tenant/domains/{domain}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class RemoveDomain
{
    use AsController;

    public function __invoke(Domain $domain): Response
    {
        if ($domain->isPrimary()) {
            // Refuse when this is the last primary — the tenant would
            // have no way to reach the app after the delete.
            $others = Domain::query()
                ->where('tenant_id', $domain->tenant_id)
                ->where('id', '!=', $domain->getKey())
                ->exists();

            if (! $others) {
                throw new LastPrimaryDomainException(\sprintf(
                    'Cannot delete the last primary domain for tenant "%s".',
                    $domain->tenant_id,
                ));
            }
        }

        $domain->delete();

        return \response()->noContent();
    }
}
