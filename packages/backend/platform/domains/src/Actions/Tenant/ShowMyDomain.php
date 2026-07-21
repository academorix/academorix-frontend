<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Data\DomainData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/tenant/domains/{domain}` — read one domain owned by
 * the caller tenant. The `TenantScope` global scope ensures the
 * lookup can only resolve rows in the caller's tenant.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.tenant.show')]
#[Get('/api/v1/tenant/domains/{domain}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class ShowMyDomain
{
    use AsController;

    public function __invoke(Domain $domain): DomainData
    {
        return DomainData::fromModel($domain);
    }
}
