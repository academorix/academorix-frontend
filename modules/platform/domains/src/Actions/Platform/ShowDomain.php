<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Platform;

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
 * `GET /api/v1/platform/domains/{domain}` — read one domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.platform.show')]
#[Get('/api/v1/platform/domains/{domain}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::View)]
final class ShowDomain
{
    use AsController;

    public function __invoke(Domain $domain): DomainData
    {
        return DomainData::fromModel($domain);
    }
}
