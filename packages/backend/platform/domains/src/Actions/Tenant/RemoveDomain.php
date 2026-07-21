<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Exceptions\LastPrimaryDomainException;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
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
