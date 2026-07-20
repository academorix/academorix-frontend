<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Data\DomainData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Models\Domain;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

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
